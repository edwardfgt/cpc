import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateClickLink } from '../utils/links';
import { supabase } from '../lib/supabase';

export async function campaignRoutes(fastify: FastifyInstance) {
    // Campaign creation endpoint
    fastify.post('/create-campaign', async (request: FastifyRequest<{
        Body: {
            placementId?: string;
            destinationUrl: string;
        }
    }>, reply: FastifyReply) => {
        const { placementId, destinationUrl } = request.body;

        if (!destinationUrl) {
            return reply.status(400).send({
                error: 'Missing required field: destinationUrl'
            });
        }

        try {
            // Insert the campaign into Supabase
            const { data: campaign, error } = await supabase
                .from('campaigns')
                .insert({ landing_url: destinationUrl })
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to create campaign'
                });
            }

            // Generate the tracking link using the database ID
            const trackingLink = generateClickLink(campaign.id);

            return reply.send({
                trackingLink,
                campaignId: campaign.id,
                destinationUrl: campaign.landing_url
            });
        } catch (err) {
            console.error('Error creating campaign:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get campaign details
    fastify.get('/campaigns/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { data: campaign, error } = await supabase
                .from('campaigns')
                .select()
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.status(404).send({
                        error: 'Campaign not found'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch campaign'
                });
            }

            return reply.send(campaign);
        } catch (err) {
            console.error('Error fetching campaign:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
} 