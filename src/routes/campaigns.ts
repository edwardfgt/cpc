import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateClickLink } from '../utils/links';

// In-memory store for campaign destinations
export const campaignDestinations: Record<string, string> = {};

export async function campaignRoutes(fastify: FastifyInstance) {
    // Campaign creation endpoint
    fastify.post('/create-campaign', async (request: FastifyRequest<{
        Body: {
            cmid: string;
            destinationUrl: string;
        }
    }>, reply: FastifyReply) => {
        const { cmid, destinationUrl } = request.body;

        if (!cmid || !destinationUrl) {
            return reply.status(400).send({
                error: 'Missing required fields: cmid and destinationUrl'
            });
        }

        // Store the destination URL for this campaign
        campaignDestinations[cmid] = destinationUrl;

        // Generate the tracking link
        const trackingLink = generateClickLink(cmid);

        return reply.send({
            trackingLink,
            cmid,
            destinationUrl
        });
    });
} 