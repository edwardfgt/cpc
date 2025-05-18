import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateClickLink } from '../utils/links';

// In-memory store for campaign destinations
export const campaignDestinations: Record<string, string> = {};

export async function campaignRoutes(fastify: FastifyInstance) {
    // Campaign creation endpoint
    fastify.post('/create-campaign', async (request: FastifyRequest<{
        Body: {
            placementId: string;
            destinationUrl: string;
        }
    }>, reply: FastifyReply) => {
        const { placementId, destinationUrl } = request.body;

        // Check for missing fields with specific error messages
        if (!placementId && !destinationUrl) {
            return reply.status(400).send({
                error: 'Missing required fields: placementId and destinationUrl'
            });
        }

        if (!placementId) {
            return reply.status(400).send({
                error: 'Missing required field: placementId'
            });
        }

        if (!destinationUrl) {
            return reply.status(400).send({
                error: 'Missing required field: destinationUrl'
            });
        }

        // Store the destination URL for this campaign
        campaignDestinations[placementId] = destinationUrl;

        // Generate the tracking link
        const trackingLink = generateClickLink(placementId);

        return reply.send({
            trackingLink,
            placementId,
            destinationUrl
        });
    });
} 