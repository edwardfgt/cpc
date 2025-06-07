import {
    verifySignature,
    isValidToken,
    checkIpTokenUniqueness,
    isBotUserAgent,
    isLinkValid,
    extractToken
} from '../utils/validation';
import { ipTokenStore } from '../routes/clicks';

describe('Validation Functions', () => {
    beforeEach(() => {
        // Clear the ipTokenStore before each test
        ipTokenStore.clear();
    });

    describe('isBotUserAgent', () => {
        it('should detect common bot user agents', () => {
            expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
            expect(isBotUserAgent('curl/7.64.1')).toBe(true);
            expect(isBotUserAgent('python-requests/2.25.1')).toBe(true);
        });

        it('should allow legitimate browser user agents', () => {
            expect(isBotUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')).toBe(false);
            expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe(false);
        });

        it('should block empty user agents', () => {
            expect(isBotUserAgent('')).toBe(true);
        });
    });

    describe('isLinkValid', () => {
        it('should validate links within 72 hours', () => {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            expect(isLinkValid(oneHourAgo.toISOString())).toBe(true);
        });

        it('should invalidate links older than 72 hours', () => {
            const now = new Date();
            // Create a date 73 hours ago to ensure it's definitely outside the window
            const oldDate = new Date(now.getTime() - (73 * 60 * 60 * 1000));
            console.log('Testing link validity with date:', oldDate.toISOString());
            expect(isLinkValid(oldDate.toISOString())).toBe(false);
        });
    });

    describe('checkIpTokenUniqueness', () => {
        it('should allow first click from an IP', () => {
            expect(checkIpTokenUniqueness('1.2.3.4', 'token123')).toBe(true);
        });

        it('should block duplicate clicks from same IP and token', () => {
            checkIpTokenUniqueness('1.2.3.4', 'token123');
            expect(checkIpTokenUniqueness('1.2.3.4', 'token123')).toBe(false);
        });

        it('should allow different tokens from same IP', () => {
            checkIpTokenUniqueness('1.2.3.4', 'token123');
            expect(checkIpTokenUniqueness('1.2.3.4', 'token456')).toBe(true);
        });
    });

    describe('isValidToken', () => {
        it('should validate correct token format', () => {
            // Using a valid 40-character hex string
            const token = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
            console.log('Testing token:', token);
            expect(isValidToken(token)).toBe(true);
        });

        it('should reject invalid token format', () => {
            expect(isValidToken('invalid-token')).toBe(false);
            expect(isValidToken('123')).toBe(false);
            expect(isValidToken('')).toBe(false);
            // Test with non-hex characters
            expect(isValidToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')).toBe(false);
        });
    });

    describe('extractToken', () => {
        it('should extract token from various query parameters', () => {
            const query = {
                _bhlid: 'token123',
                other: 'value'
            };
            expect(extractToken(query)).toBe('token123');
        });

        it('should return null if no token found', () => {
            const query = {
                other: 'value'
            };
            expect(extractToken(query)).toBe(null);
        });
    });
}); 