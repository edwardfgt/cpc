import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';

export async function publisherRoutes(fastify: FastifyInstance) {
    // Create publisher
    fastify.post('/publishers', async (request: FastifyRequest<{
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
            const { data: publisher, error } = await supabase
                .from('publishers')
                .insert({ name })
                .select()
                .single();

            if (error) {
                if (error.code === '23505' && error.message.includes('publishers_name_key')) {
                    return reply.status(409).send({
                        error: 'A publisher with this name already exists'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to create publisher'
                });
            }

            return reply.status(201).send(publisher);
        } catch (err) {
            console.error('Error creating publisher:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get all publishers
    fastify.get('/publishers', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { data: publishers, error } = await supabase
                .from('publishers')
                .select('*');

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch publishers'
                });
            }

            return reply.send(publishers);
        } catch (err) {
            console.error('Error fetching publishers:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get single publisher
    fastify.get('/publishers/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { data: publisher, error } = await supabase
                .from('publishers')
                .select()
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.status(404).send({
                        error: 'Publisher not found'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch publisher'
                });
            }

            return reply.send(publisher);
        } catch (err) {
            console.error('Error fetching publisher:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Update publisher
    fastify.put('/publishers/:id', async (request: FastifyRequest<{
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
            const { data: publisher, error } = await supabase
                .from('publishers')
                .update({ name })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === '23505' && error.message.includes('publishers_name_key')) {
                    return reply.status(409).send({
                        error: 'A publisher with this name already exists'
                    });
                }
                if (error.code === 'PGRST116') {
                    return reply.status(404).send({
                        error: 'Publisher not found'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to update publisher'
                });
            }

            return reply.send(publisher);
        } catch (err) {
            console.error('Error updating publisher:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Delete publisher
    fastify.delete('/publishers/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { error } = await supabase
                .from('publishers')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to delete publisher'
                });
            }

            return reply.status(204).send();
        } catch (err) {
            console.error('Error deleting publisher:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
} 