import { FastifyInstance } from 'fastify';
import { advertiserRoutes } from '../routes/advertisers';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            insert: jest.fn(),
            select: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            eq: jest.fn(),
            single: jest.fn()
        }))
    }
}));

describe('Advertiser Routes', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = require('fastify')();
        await app.register(advertiserRoutes);
    });

    afterEach(async () => {
        await app.close();
        jest.clearAllMocks();
    });

    describe('POST /advertisers', () => {
        it('should create a new advertiser', async () => {
            const mockAdvertiser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Advertiser'
            };

            // Mock successful insert
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockAdvertiser, error: null })
                    })
                })
            });

            const response = await app.inject({
                method: 'POST',
                url: '/advertisers',
                payload: { name: 'Test Advertiser' }
            });

            expect(response.statusCode).toBe(201);
            expect(JSON.parse(response.payload)).toEqual(mockAdvertiser);
        });

        it('should return 400 when name is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/advertisers',
                payload: {}
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Missing required field: name'
            });
        });

        it('should return 409 when name already exists', async () => {
            // Mock unique constraint violation
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: {
                                code: '23505',
                                message: 'duplicate key value violates unique constraint "advertisers_name_key"'
                            }
                        })
                    })
                })
            });

            const response = await app.inject({
                method: 'POST',
                url: '/advertisers',
                payload: { name: 'Existing Advertiser' }
            });

            expect(response.statusCode).toBe(409);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'An advertiser with this name already exists'
            });
        });
    });

    describe('GET /advertisers', () => {
        it('should return all advertisers', async () => {
            const mockAdvertisers = [
                { id: '1', name: 'Advertiser 1' },
                { id: '2', name: 'Advertiser 2' }
            ];

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue({ data: mockAdvertisers, error: null })
            });

            const response = await app.inject({
                method: 'GET',
                url: '/advertisers'
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(mockAdvertisers);
        });
    });

    describe('GET /advertisers/:id', () => {
        it('should return a single advertiser', async () => {
            const mockAdvertiser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Advertiser'
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockAdvertiser, error: null })
                    })
                })
            });

            const response = await app.inject({
                method: 'GET',
                url: '/advertisers/123e4567-e89b-12d3-a456-426614174000'
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(mockAdvertiser);
        });

        it('should return 404 when advertiser not found', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: 'PGRST116' }
                        })
                    })
                })
            });

            const response = await app.inject({
                method: 'GET',
                url: '/advertisers/non-existent-id'
            });

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Advertiser not found'
            });
        });
    });

    describe('PUT /advertisers/:id', () => {
        it('should update an advertiser', async () => {
            const mockAdvertiser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Advertiser'
            };

            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockAdvertiser, error: null })
                        })
                    })
                })
            });

            const response = await app.inject({
                method: 'PUT',
                url: '/advertisers/123e4567-e89b-12d3-a456-426614174000',
                payload: { name: 'Updated Advertiser' }
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(mockAdvertiser);
        });

        it('should return 409 when updated name already exists', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: {
                                    code: '23505',
                                    message: 'duplicate key value violates unique constraint "advertisers_name_key"'
                                }
                            })
                        })
                    })
                })
            });

            const response = await app.inject({
                method: 'PUT',
                url: '/advertisers/123e4567-e89b-12d3-a456-426614174000',
                payload: { name: 'Existing Advertiser' }
            });

            expect(response.statusCode).toBe(409);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'An advertiser with this name already exists'
            });
        });
    });

    describe('DELETE /advertisers/:id', () => {
        it('should delete an advertiser', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const response = await app.inject({
                method: 'DELETE',
                url: '/advertisers/123e4567-e89b-12d3-a456-426614174000'
            });

            expect(response.statusCode).toBe(204);
        });

        it('should handle deletion error', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: new Error('Deletion failed')
                    })
                })
            });

            const response = await app.inject({
                method: 'DELETE',
                url: '/advertisers/123e4567-e89b-12d3-a456-426614174000'
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Failed to delete advertiser'
            });
        });
    });
}); 