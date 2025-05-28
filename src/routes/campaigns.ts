import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateClickLink } from '../utils/links';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

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
            // Insert the placement into Supabase
            const { data: placement, error } = await supabase
                .from('campaigns')
                .insert({ landing_url: destinationUrl })
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to create placement'
                });
            }

            // Generate the tracking link using the database ID
            const trackingLink = generateClickLink(placement.id);

            return reply.send({
                trackingLink,
                placementId: placement.id,
                destinationUrl: placement.landing_url
            });
        } catch (err) {
            console.error('Error creating placement:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get placement details
    fastify.get('/campaigns/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { data: placement, error } = await supabase
                .from('campaigns')
                .select()
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.status(404).send({
                        error: 'Placement not found'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch placement'
                });
            }

            return reply.send(placement);
        } catch (err) {
            console.error('Error fetching placement:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
} 