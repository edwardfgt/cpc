import { timingSafeEqual } from 'crypto';
import { signPlacementId } from './links';
import { ipTokenStore } from '../routes/clicks';

export function verifySignature(placementId: string, signature: string): boolean {
    const expectedSignature = signPlacementId(placementId);
    return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Token validation
export function isValidToken(token: string): boolean {
    return /^[a-f0-9]{40}$/i.test(token);
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

// Extract first available token from query params
export function extractToken(query: Record<string, string>): string | null {
    const tokenKeys = ['_bhlid', 'mc_eid', 'subscription_id', 'subscriber_id'];
    for (const key of tokenKeys) {
        if (query[key]) return query[key];
    }
    return null;
} 