import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifySignature, extractToken, isValidToken, checkIpTokenUniqueness } from '../utils/validation';
import { supabase } from '../lib/supabase';

// In-memory stores for click tracking
export const clickStore: Record<string, Set<string>> = {};
export const ipTokenStore = new Map<string, Set<string>>(); // IP -> Set of tokens
export let totalClicks = 0;
export let uniqueClicks = 0;
export let failedClicks = 0;

const REDIRECT_URL = 'https://example.com/landing';

export async function clickRoutes(fastify: FastifyInstance) {
    // Click tracking endpoint
    fastify.get('/c', async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
        const { placementId, sig, ...rest } = request.query;
        const ip = request.ip;
        const userAgent = request.headers['user-agent'] || '';

        // 1. Signature verification
        if (!placementId || !sig) {
            failedClicks++;
            console.log(`❌ Click Failed: Missing parameters (placementId: ${placementId || 'missing'}, sig: ${sig || 'missing'})`);
            return reply.redirect(REDIRECT_URL);
        }

        if (!verifySignature(placementId, sig)) {
            failedClicks++;
            console.log(`❌ Click Failed: Invalid signature (placementId: ${placementId})`);
            return reply.redirect(REDIRECT_URL);
        }

        // 2. Token format validation
        const token = extractToken(rest);
        if (!token) {
            failedClicks++;
            console.log(`❌ Click Failed: No token found (placementId: ${placementId})`);
            return reply.redirect(REDIRECT_URL);
        }

        if (!isValidToken(token)) {
            failedClicks++;
            console.log(`❌ Click Failed: Invalid token format (token: ${token})`);
            return reply.redirect(REDIRECT_URL);
        }

        // 3. IP-token uniqueness check
        if (!checkIpTokenUniqueness(ip, token)) {
            failedClicks++;
            console.log(`❌ Click Failed: Duplicate IP-token (IP: ${ip}, token: ${token})`);
            return reply.redirect(REDIRECT_URL);
        }

        // 4. Get placement details from Supabase
        const { data: placement, error } = await supabase
            .from('placements')
            .select('landing_url')
            .eq('id', placementId)
            .single();

        if (error || !placement) {
            failedClicks++;
            console.log(`❌ Click Failed: Placement not found (placementId: ${placementId})`);
            return reply.redirect(REDIRECT_URL);
        }

        // 5. Existing de-duplication logic
        const isBillable = !clickStore[placementId]?.has(token);

        // Store the token for this placementId
        if (!clickStore[placementId]) {
            clickStore[placementId] = new Set();
        }
        clickStore[placementId].add(token);

        // Update counters
        totalClicks++;
        if (isBillable) {
            uniqueClicks++;
        }

        // Log the click with a clear format
        console.log(`✅ Click Accepted: ${isBillable ? 'Billable' : 'Duplicate'} (placementId: ${placementId}, token: ${token})`);
        console.log(`📊 Stats: Total: ${totalClicks}, Unique: ${uniqueClicks}, Failed: ${failedClicks}\n`);

        // Redirect to the placement's landing URL
        return reply.redirect(placement.landing_url);
    });
} 