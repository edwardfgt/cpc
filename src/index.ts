import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac, timingSafeEqual } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const HMAC_SECRET = process.env.HMAC_SECRET || 'default-secret-for-development';
const REDIRECT_URL = 'https://example.com/landing';

// In-memory stores
const clickStore: Record<string, Set<string>> = {};
const ipTokenStore = new Map<string, Set<string>>(); // IP -> Set of tokens
let totalClicks = 0;
let uniqueClicks = 0;
let failedClicks = 0;

// HMAC helper functions
function signCmid(cmid: string): string {
    return createHmac('sha256', HMAC_SECRET)
        .update(cmid)
        .digest('hex');
}

function verifySignature(cmid: string, signature: string): boolean {
    const expectedSignature = signCmid(cmid);
    return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Token validation
function isValidToken(token: string): boolean {
    return /^[a-f0-9]{40}$/i.test(token);
}

// IP-token uniqueness check
function checkIpTokenUniqueness(ip: string, token: string): boolean {
    const tokens = ipTokenStore.get(ip);

    if (!tokens) {
        // First click from this IP
        ipTokenStore.set(ip, new Set([token]));
        return true;
    }

    if (tokens.has(token)) {
        // This IP has already clicked with this token
        return false;
    }

    // New token from this IP
    tokens.add(token);
    return true;
}

// Generate a click link with signed cmid
function generateClickLink(cmid: string): string {
    const signature = signCmid(cmid);
    return `http://localhost:3000/c?cmid=${cmid}&sig=${signature}`;
}

// Extract first available token from query params
function extractToken(query: Record<string, string>): string | null {
    const tokenKeys = ['_bhlid', 'mc_eid', 'subscription_id', 'subscriber_id'];
    for (const key of tokenKeys) {
        if (query[key]) return query[key];
    }
    return null;
}

// Create Fastify server
const server = Fastify();

// Click tracking endpoint
server.get('/c', async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
    const { cmid, sig, ...rest } = request.query;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'] || '';

    // 1. Signature verification
    if (!cmid || !sig) {
        failedClicks++;
        console.log(`❌ Click Failed: Missing parameters (cmid: ${cmid || 'missing'}, sig: ${sig || 'missing'})`);
        return reply.redirect(REDIRECT_URL);
    }

    if (!verifySignature(cmid, sig)) {
        failedClicks++;
        console.log(`❌ Click Failed: Invalid signature (cmid: ${cmid})`);
        return reply.redirect(REDIRECT_URL);
    }

    // 2. Token format validation
    const token = extractToken(rest);
    if (!token) {
        failedClicks++;
        console.log(`❌ Click Failed: No token found (cmid: ${cmid})`);
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

    // Redirect to landing page
    return reply.redirect(REDIRECT_URL);
});

// Start the server
const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running at http://localhost:3000');

        // Hardcoded test link for Beehiiv testing
        const testLink = 'http://localhost:3000/c?cmid=newsletter-test-1&sig=3f5c53f5db16c024f3667d6818b862f91cc524739ec1088d69635e1fff72d258';
        console.log('\n=== Newsletter Test Link ===');
        console.log('Use this link in your newsletter:');
        console.log(testLink);
        console.log('===========================\n');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start(); 