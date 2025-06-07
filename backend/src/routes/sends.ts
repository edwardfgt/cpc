import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';

export async function sendRoutes(fastify: FastifyInstance) {
    // Create newsletter send
    fastify.post('/sends', async (request: FastifyRequest<{
        Body: {
            publisherId: string;
            sendDate: string;
            subject: string;
        }
    }>, reply: FastifyReply) => {
        const { publisherId, sendDate, subject } = request.body;

        // Validate required fields
        if (!publisherId || !sendDate || !subject) {
            return reply.status(400).send({
                error: 'Missing required fields: publisherId, sendDate, and subject are required'
            });
        }

        // Validate date format and not in past
        const date = new Date(sendDate);
        if (isNaN(date.getTime())) {
            return reply.status(400).send({
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        if (date < today) {
            return reply.status(400).send({
                error: 'Send date cannot be in the past'
            });
        }

        try {
            // Check if publisher exists
            const { data: publisher, error: publisherError } = await supabase
                .from('publishers')
                .select('id')
                .eq('id', publisherId)
                .single();

            if (publisherError || !publisher) {
                return reply.status(400).send({
                    error: 'Publisher not found'
                });
            }

            // Check for duplicate send date for this publisher
            const { data: existingSend, error: duplicateError } = await supabase
                .from('newsletter_sends')
                .select('id')
                .eq('publisher_id', publisherId)
                .eq('send_date', sendDate)
                .single();

            if (existingSend) {
                return reply.status(409).send({
                    error: 'A newsletter send already exists for this publisher on this date'
                });
            }

            // Create the newsletter send
            const { data: send, error } = await supabase
                .from('newsletter_sends')
                .insert({
                    publisher_id: publisherId,
                    send_date: sendDate,
                    subject
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to create newsletter send'
                });
            }

            return reply.status(201).send(send);
        } catch (err) {
            console.error('Error creating newsletter send:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get newsletter sends with filters
    fastify.get('/sends', async (request: FastifyRequest<{
        Querystring: {
            publisherId?: string;
            from?: string;
            to?: string;
            limit?: string;
            cursor?: string;
        }
    }>, reply: FastifyReply) => {
        const { publisherId, from, to, limit = '20', cursor } = request.query;

        try {
            let query = supabase
                .from('newsletter_sends')
                .select(`
                    *,
                    publisher:publishers (
                        id,
                        name,
                        email
                    )
                `);

            // Apply filters
            if (publisherId) {
                query = query.eq('publisher_id', publisherId);
            }
            if (from) {
                query = query.gte('send_date', from);
            }
            if (to) {
                query = query.lte('send_date', to);
            }

            // Apply pagination
            const limitNum = parseInt(limit, 10);
            query = query.limit(limitNum);
            if (cursor) {
                query = query.gt('id', cursor);
            }

            const { data: sends, error } = await query;

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch newsletter sends'
                });
            }

            return reply.send(sends);
        } catch (err) {
            console.error('Error fetching newsletter sends:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get single newsletter send
    fastify.get('/sends/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { data: send, error } = await supabase
                .from('newsletter_sends')
                .select(`
                    *,
                    publisher:publishers (
                        id,
                        name,
                        email
                    )
                `)
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.status(404).send({
                        error: 'Newsletter send not found'
                    });
                }
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch newsletter send'
                });
            }

            return reply.send(send);
        } catch (err) {
            console.error('Error fetching newsletter send:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Update newsletter send
    fastify.put('/sends/:id', async (request: FastifyRequest<{
        Params: { id: string },
        Body: {
            sendDate?: string;
            subject?: string;
        }
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { sendDate, subject } = request.body;

        // Validate at least one field is provided
        if (!sendDate && !subject) {
            return reply.status(400).send({
                error: 'At least one field (sendDate or subject) must be provided'
            });
        }

        try {
            // If sendDate is being updated, check for duplicates
            if (sendDate) {
                const date = new Date(sendDate);
                if (isNaN(date.getTime())) {
                    return reply.status(400).send({
                        error: 'Invalid date format. Use YYYY-MM-DD'
                    });
                }

                // Get the current send to check publisher_id
                const { data: currentSend, error: fetchError } = await supabase
                    .from('newsletter_sends')
                    .select('publisher_id')
                    .eq('id', id)
                    .single();

                if (fetchError) {
                    return reply.status(404).send({
                        error: 'Newsletter send not found'
                    });
                }

                // Check for duplicate send date
                const { data: existingSend, error: duplicateError } = await supabase
                    .from('newsletter_sends')
                    .select('id')
                    .eq('publisher_id', currentSend.publisher_id)
                    .eq('send_date', sendDate)
                    .neq('id', id)
                    .single();

                if (existingSend) {
                    return reply.status(409).send({
                        error: 'A newsletter send already exists for this publisher on this date'
                    });
                }
            }

            // Update the newsletter send
            const { data: send, error } = await supabase
                .from('newsletter_sends')
                .update({
                    ...(sendDate && { send_date: sendDate }),
                    ...(subject && { subject })
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to update newsletter send'
                });
            }

            return reply.send(send);
        } catch (err) {
            console.error('Error updating newsletter send:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Delete newsletter send (soft delete)
    fastify.delete('/sends/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            // Check if the send is referenced by any campaigns
            const { data: campaigns, error: checkError } = await supabase
                .from('campaigns')
                .select('id')
                .eq('newsletter_send_id', id)
                .limit(1);

            if (checkError) {
                console.error('Supabase error:', checkError);
                return reply.status(500).send({
                    error: 'Failed to check campaign references'
                });
            }

            if (campaigns && campaigns.length > 0) {
                return reply.status(409).send({
                    error: 'Cannot delete newsletter send: it is linked to campaigns'
                });
            }

            // Perform soft delete
            const { error } = await supabase
                .from('newsletter_sends')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                console.error('Supabase error:', error);
                return reply.status(500).send({
                    error: 'Failed to delete newsletter send'
                });
            }

            return reply.status(204).send();
        } catch (err) {
            console.error('Error deleting newsletter send:', err);
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
} 