import { timingSafeEqual } from 'crypto';
import { signPlacementId } from './links';
import { ipTokenStore } from '../routes/clicks';

// Common bot user agents to block
const COMMON_BOT_HEADERS = [
    'bot',
    'crawler',
    'spider',
    'curl',
    'wget',
    'python-requests',
    'apache-httpclient',
    'java-http-client',
    'headless',
    'selenium'
];

// Link validity period in milliseconds (72 hours)
const LINK_VALIDITY_PERIOD = 72 * 60 * 60 * 1000;

export function verifySignature(placementId: string, signature: string): boolean {
    const expectedSignature = signPlacementId(placementId);
    return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Token validation - 40 character hex string
export function isValidToken(token: string): boolean {
    // Debug log the token and its length
    console.log('Validating token:', token, 'Length:', token.length);
    // Check for exactly 40 characters of hex (0-9, a-f, A-F)
    return /^[0-9a-fA-F]{40}$/.test(token);
}

// IP-token uniqueness check
export function checkIpTokenUniqueness(ip: string, token: string): boolean {
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

// Check for common bot user agents
export function isBotUserAgent(userAgent: string): boolean {
    if (!userAgent) return true; // Block empty user agents

    const lowerUserAgent = userAgent.toLowerCase();
    return COMMON_BOT_HEADERS.some(header => lowerUserAgent.includes(header));
}

// Check if a link is still valid (within 72 hours of creation)
export function isLinkValid(createdAt: string): boolean {
    const creationTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const timeDiff = currentTime - creationTime;

    // Debug logging
    console.log('Link validation:', {
        createdAt,
        creationTime,
        currentTime,
        timeDiff,
        validityPeriod: LINK_VALIDITY_PERIOD,
        isValid: timeDiff > 0 && timeDiff <= LINK_VALIDITY_PERIOD
    });

    return timeDiff > 0 && timeDiff <= LINK_VALIDITY_PERIOD;
}

// Extract first available token from query params
export function extractToken(query: Record<string, string>): string | null {
    const tokenKeys = ['_bhlid', 'mc_eid', 'subscription_id', 'subscriber_id'];
    for (const key of tokenKeys) {
        if (query[key]) return query[key];
    }
    return null;
} 