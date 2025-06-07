import { FastifyInstance } from 'fastify';
import { clickRoutes } from '../routes/clicks';
import { supabase } from '../lib/supabase';
import { signPlacementId } from '../utils/links';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn()
                }))
            }))
        }))
    }
}));

describe('Click Routes', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = require('fastify')();
        await app.register(clickRoutes);
    });

    afterEach(async () => {
        await app.close();
    });

    it('should redirect to landing URL for valid click', async () => {
        // Mock placement data
        const mockPlacement = {
            landing_url: 'https://example.com/landing',
            created_at: new Date().toISOString()
        };

        // Mock Supabase response
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockPlacement, error: null })
                })
            })
        });

        const placementId = 'test-placement';
        const signature = signPlacementId(placementId);
        const token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

        const response = await app.inject({
            method: 'GET',
            url: `/c?cmid=${placementId}&sig=${signature}&_bhlid=${token}`,
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        expect(response.statusCode).toBe(302); // Redirect
        expect(response.headers.location).toBe(mockPlacement.landing_url);
    });

    it('should reject bot traffic', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/c?cmid=test&sig=test',
            headers: {
                'user-agent': 'python-requests/2.25.1'
            }
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('https://example.com/landing');
    });

    it('should reject expired links', async () => {
        // Mock placement data with old timestamp
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 4); // 4 days old
        const mockPlacement = {
            landing_url: 'https://example.com/landing',
            created_at: oldDate.toISOString()
        };

        // Mock Supabase response
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockPlacement, error: null })
                })
            })
        });

        const placementId = 'test-placement';
        const signature = signPlacementId(placementId);
        const token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

        const response = await app.inject({
            method: 'GET',
            url: `/c?cmid=${placementId}&sig=${signature}&_bhlid=${token}`,
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('https://example.com/landing');
    });
}); 