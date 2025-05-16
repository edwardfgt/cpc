import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac, timingSafeEqual } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const HMAC_SECRET = process.env.HMAC_SECRET || 'default-secret-for-development';
const REDIRECT_URL = 'https://example.com/landing';

// In-memory store for click tracking
// Note: This is temporary and will be lost on server restart
// To migrate to Redis:
// 1. Replace this with a Redis client
// 2. Use Redis SET with NX flag for atomic operations
// 3. Add TTL for data expiration
const clickStore: Record<string, Set<string>> = {};
let totalClicks = 0;
let uniqueClicks = 0;

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

    if (!cmid || !sig) {
        return reply.code(400).send({ error: 'Missing cmid or signature' });
    }

    if (!verifySignature(cmid, sig)) {
        return reply.code(400).send({ error: 'Invalid signature' });
    }

    const token = extractToken(rest);
    if (!token) {
        return reply.code(400).send({ error: 'No valid token found' });
    }

    // Check if this cmid:token combination has been seen before
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
    console.log('\n=== Click Event ===');
    console.log(`Total Clicks: ${totalClicks}`);
    console.log(`Unique Clicks: ${uniqueClicks}`);
    console.log(`CMID: ${cmid}`);
    console.log(`Token: ${token}`);
    console.log(`Billable: ${isBillable}`);
    console.log('==================\n');

    // Redirect to landing page
    return reply.redirect(REDIRECT_URL);
});

// Start the server
const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running at http://localhost:3000');
        console.log('\nTo test, visit: http://localhost:3000/c?cmid=test-123&sig=' + signCmid('test-123') + '&_bhlid=test-token-1');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start(); 