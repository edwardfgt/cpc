import Fastify, { FastifyInstance } from 'fastify';
import { campaignRoutes } from '../routes/campaigns';
import { generateClickLink } from '../utils/links';

// Mock the generateClickLink function
jest.mock('../utils/links', () => ({
    generateClickLink: jest.fn().mockReturnValue('http://localhost:3000/c?cmid=test-campaign&sig=mock-signature')
}));

describe('Campaign Routes', () => {
    let server: FastifyInstance;

    beforeEach(() => {
        server = Fastify();
        server.register(campaignRoutes);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /create-campaign', () => {
        it('should create a campaign and return tracking link', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/create-campaign',
                payload: {
                    cmid: 'test-campaign',
                    destinationUrl: 'https://example.com/test'
                }
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toEqual({
                trackingLink: 'http://localhost:3000/c?cmid=test-campaign&sig=mock-signature',
                cmid: 'test-campaign',
                destinationUrl: 'https://example.com/test'
            });
            expect(generateClickLink).toHaveBeenCalledWith('test-campaign');
        });

        it('should return 400 when cmid is missing', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/create-campaign',
                payload: {
                    destinationUrl: 'https://example.com/test'
                }
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body).toEqual({
                error: 'Missing required field: cmid'
            });
        });

        it('should return 400 when destinationUrl is missing', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/create-campaign',
                payload: {
                    cmid: 'test-campaign'
                }
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body).toEqual({
                error: 'Missing required field: destinationUrl'
            });
        });

        it('should return 400 when both fields are missing', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/create-campaign',
                payload: {}
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body).toEqual({
                error: 'Missing required fields: cmid and destinationUrl'
            });
        });
    });
}); 