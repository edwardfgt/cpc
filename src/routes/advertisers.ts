import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';

export async function advertiserRoutes(fastify: FastifyInstance) {
    fastify.post('/advertisers', async (request: FastifyRequest<{
        Body: {
            name: string;
        }
    }>, reply: FastifyReply) => {
        const { name } = request.body;

        if (!name) {
            return reply.status(400).send({
                error: 'Missing required field: name'
            });
        }

        try {
            const { data: advertiser, error } = await supabase
                .from('advertisers')
                .insert({ name })
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to create advertiser'
                });
            }

            return reply.status(201).send(advertiser);
        } catch (err) {
            console.error('Error creating advertiser:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get all advertisers
    fastify.get('/advertisers', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { data: advertisers, error } = await supabase
                .from('advertisers')
                .select('*');

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch advertisers'
                });
            }

            return reply.send(advertisers);
        } catch (err) {
            console.error('Error fetching advertisers:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get single advertiser
    fastify.get('/advertisers/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { data: advertiser, error } = await supabase
                .from('advertisers')
                .select()
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.status(404).send({
                        error: 'Advertiser not found'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch advertiser'
                });
            }

            return reply.send(advertiser);
        } catch (err) {
            console.error('Error fetching advertiser:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Update advertiser
    fastify.put('/advertisers/:id', async (request: FastifyRequest<{
        Params: { id: string },
        Body: {
            name: string;
        }
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { name } = request.body;

        if (!name) {
            return reply.status(400).send({
                error: 'Missing required field: name'
            });
        }

        try {
            const { data: advertiser, error } = await supabase
                .from('advertisers')
                .update({ name })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.status(404).send({
                        error: 'Advertiser not found'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to update advertiser'
                });
            }

            return reply.send(advertiser);
        } catch (err) {
            console.error('Error updating advertiser:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Delete advertiser
    fastify.delete('/advertisers/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { error } = await supabase
                .from('advertisers')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to delete advertiser'
                });
            }

            return reply.status(204).send();
        } catch (err) {
            console.error('Error deleting advertiser:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
} 