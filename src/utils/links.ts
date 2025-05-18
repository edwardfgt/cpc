import { createHmac } from 'crypto';

const HMAC_SECRET = process.env.HMAC_SECRET || 'default-secret-for-development';

// HMAC helper functions
export function signCmid(cmid: string): string {
    return createHmac('sha256', HMAC_SECRET)
        .update(cmid)
        .digest('hex');
}

// Generate a click link with signed cmid
export function generateClickLink(cmid: string): string {
    const signature = signCmid(cmid);
    return `http://localhost:3000/c?cmid=${cmid}&sig=${signature}`;
} 