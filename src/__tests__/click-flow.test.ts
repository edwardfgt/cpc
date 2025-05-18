import Fastify, { FastifyInstance } from 'fastify';
import { campaignRoutes } from '../routes/campaigns';
import { clickRoutes } from '../routes/clicks';

describe('Click Tracking Flow', () => {
    let server: FastifyInstance;

    beforeEach(() => {
        server = Fastify();
        server.register(campaignRoutes);
        server.register(clickRoutes);
    });

    it('should track a click through the full flow', async () => {
        // 1. Create a campaign
        const createResponse = await server.inject({
            method: 'POST',
            url: '/create-campaign',
            payload: {
                placementId: 'test-flow-1',
                destinationUrl: 'https://example.com/test-destination'
            }
        });

        expect(createResponse.statusCode).toBe(200);
        const { trackingLink } = JSON.parse(createResponse.body);

        // 2. Simulate a click with a token
        const clickResponse = await server.inject({
            method: 'GET',
            url: trackingLink,
            headers: {
                'user-agent': 'test-browser',
                'x-forwarded-for': '127.0.0.1'
            },
            query: {
                _bhlid: '1234567890abcdef1234567890abcdef12345678' // 40-character hex token
            }
        });

        // 3. Verify the click was tracked
        expect(clickResponse.statusCode).toBe(302); // Redirect status
        expect(clickResponse.headers.location).toBe('https://example.com/test-destination');

        // 4. Try clicking again with the same token (should be counted as duplicate)
        const duplicateClickResponse = await server.inject({
            method: 'GET',
            url: trackingLink,
            headers: {
                'user-agent': 'test-browser',
                'x-forwarded-for': '127.0.0.1'
            },
            query: {
                _bhlid: '1234567890abcdef1234567890abcdef12345678'
            }
        });

        expect(duplicateClickResponse.statusCode).toBe(302);
        expect(duplicateClickResponse.headers.location).toBe('https://example.com/test-destination');
    });

    it('should reject invalid clicks', async () => {
        // 1. Create a campaign
        const createResponse = await server.inject({
            method: 'POST',
            url: '/create-campaign',
            payload: {
                placementId: 'test-flow-2',
                destinationUrl: 'https://example.com/test-destination'
            }
        });

        expect(createResponse.statusCode).toBe(200);
        const { trackingLink } = JSON.parse(createResponse.body);

        // 2. Try clicking without a token
        const noTokenResponse = await server.inject({
            method: 'GET',
            url: trackingLink,
            headers: {
                'user-agent': 'test-browser',
                'x-forwarded-for': '127.0.0.1'
            }
        });

        expect(noTokenResponse.statusCode).toBe(302);
        expect(noTokenResponse.headers.location).toBe('https://example.com/test-destination');

        // 3. Try clicking with an invalid token format
        const invalidTokenResponse = await server.inject({
            method: 'GET',
            url: trackingLink,
            headers: {
                'user-agent': 'test-browser',
                'x-forwarded-for': '127.0.0.1'
            },
            query: {
                _bhlid: 'invalid-token'
            }
        });

        expect(invalidTokenResponse.statusCode).toBe(302);
        expect(invalidTokenResponse.headers.location).toBe('https://example.com/test-destination');
    });
}); 