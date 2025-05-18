import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifySignature, extractToken, isValidToken, checkIpTokenUniqueness } from '../utils/validation';
import { campaignDestinations } from './campaigns';

// In-memory stores
export const clickStore: Record<string, Set<string>> = {};
export const ipTokenStore = new Map<string, Set<string>>(); // IP -> Set of tokens
export let totalClicks = 0;
export let uniqueClicks = 0;
export let failedClicks = 0;

const REDIRECT_URL = 'https://example.com/landing';

export async function clickRoutes(fastify: FastifyInstance) {
    // Click tracking endpoint
    fastify.get('/c', async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
        const { cmid, sig, ...rest } = request.query;
        const ip = request.ip;
        const userAgent = request.headers['user-agent'] || '';

        // 1. Signature verification
        if (!cmid || !sig) {
            failedClicks++;
            console.log(`❌ Click Failed: Missing parameters (cmid: ${cmid || 'missing'}, sig: ${sig || 'missing'})`);
            return reply.redirect(campaignDestinations[cmid] || REDIRECT_URL);
        }

        if (!verifySignature(cmid, sig)) {
            failedClicks++;
            console.log(`❌ Click Failed: Invalid signature (cmid: ${cmid})`);
            return reply.redirect(campaignDestinations[cmid] || REDIRECT_URL);
        }

        // 2. Token format validation
        const token = extractToken(rest);
        if (!token) {
            failedClicks++;
            console.log(`❌ Click Failed: No token found (cmid: ${cmid})`);
            return reply.redirect(campaignDestinations[cmid] || REDIRECT_URL);
        }

        if (!isValidToken(token)) {
            failedClicks++;
            console.log(`❌ Click Failed: Invalid token format (token: ${token})`);
            return reply.redirect(campaignDestinations[cmid] || REDIRECT_URL);
        }

        // 3. IP-token uniqueness check
        if (!checkIpTokenUniqueness(ip, token)) {
            failedClicks++;
            console.log(`❌ Click Failed: Duplicate IP-token (IP: ${ip}, token: ${token})`);
            return reply.redirect(campaignDestinations[cmid] || REDIRECT_URL);
        }

        // 4. Existing de-duplication logic
        const isBillable = !clickStore[cmid]?.has(token);

        // Store the token for this cmid
        if (!clickStore[cmid]) {
            clickStore[cmid] = new Set();
        }
        clickStore[cmid].add(token);

        // Update counters
        totalClicks++;
        if (isBillable) {
            uniqueClicks++;
        }

        // Log the click with a clear format
        console.log(`✅ Click Accepted: ${isBillable ? 'Billable' : 'Duplicate'} (cmid: ${cmid}, token: ${token})`);
        console.log(`📊 Stats: Total: ${totalClicks}, Unique: ${uniqueClicks}, Failed: ${failedClicks}\n`);

        // Redirect to the campaign's destination URL or fallback to default
        return reply.redirect(campaignDestinations[cmid] || REDIRECT_URL);
    });
} 