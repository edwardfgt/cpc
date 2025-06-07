import { createHmac } from 'crypto';

const HMAC_SECRET = process.env.HMAC_SECRET || 'default-secret-for-development';

// HMAC helper functions
export function signPlacementId(placementId: string): string {
    return createHmac('sha256', HMAC_SECRET)
        .update(placementId)
        .digest('hex');
}

// Generate a click link with signed placementId
export function generateClickLink(placementId: string): string {
    const signature = signPlacementId(placementId);
    return `http://localhost:3000/c?placementId=${placementId}&sig=${signature}`;
} 