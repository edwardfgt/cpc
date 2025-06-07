import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    verifySignature,
    extractToken,
    isValidToken,
    checkIpTokenUniqueness,
    isBotUserAgent,
    isLinkValid
} from '../utils/validation';
import { supabase } from '../lib/supabase';

// In-memory stores for click tracking
export let totalClicks = 0;
export let uniqueClicks = 0;
export let failedClicks = 0;

// Add this line to create and export the ipTokenStore
export const ipTokenStore = new Map<string, Set<string>>();

const REDIRECT_URL = 'https://example.com/landing';

export async function clickRoutes(fastify: FastifyInstance) {
    // Click tracking endpoint
    fastify.get('/c', async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
        console.log('Click tracking endpoint hit');
        const { placementId, sig } = request.query;
        console.log('Query params:', { placementId, sig });
        const ip = request.ip;
        const userAgent = request.headers['user-agent'] || '';

        // Check for bot user agent
        if (isBotUserAgent(userAgent)) {
            console.log('❌ Bot user agent detected');
            failedClicks++;
            return reply.redirect(REDIRECT_URL);
        }

        // 1. Signature verification
        if (!placementId || !sig) {
            console.log('❌ Missing parameters');
            failedClicks++;
            return reply.redirect(REDIRECT_URL);
        }

        if (!verifySignature(placementId, sig)) {
            console.log('❌ Invalid signature');
            failedClicks++;
            return reply.redirect(REDIRECT_URL);
        }

        // 2. Extract and validate Beehiiv token
        const token = extractToken(request.query);
        if (!token || !isValidToken(token)) {
            console.log('❌ Invalid or missing Beehiiv token');
            failedClicks++;
            return reply.redirect(REDIRECT_URL);
        }

        // 3. Check IP-token uniqueness
        if (!checkIpTokenUniqueness(ip, token)) {
            console.log('❌ Duplicate click from same IP and token');
            failedClicks++;
            return reply.redirect(REDIRECT_URL);
        }

        // 4. Get placement details from Supabase
        console.log('Looking up placementId:', placementId);
        const { data: placement, error } = await supabase
            .from('placements')
            .select('landing_url, created_at')
            .eq('id', placementId)
            .single();

        if (error || !placement) {
            console.error('Supabase error:', error);
            console.error('Placement not found for id:', placementId);
            failedClicks++;
            return reply.redirect(REDIRECT_URL);
        }

        // 5. Check if link is still valid (within 72 hours)
        if (!isLinkValid(placement.created_at)) {
            console.log('❌ Link has expired (older than 72 hours)');
            failedClicks++;
            return reply.redirect(REDIRECT_URL);
        }

        // Update counters
        totalClicks++;
        uniqueClicks++;

        // Log the click with a clear format
        console.log(`✅ Click Accepted: Billable (placementId: ${placementId})`);
        console.log(`📊 Stats: Total: ${totalClicks}, Unique: ${uniqueClicks}, Failed: ${failedClicks}\n`);

        // Redirect to the placement's landing URL
        return reply.redirect(placement.landing_url);
    });
} 