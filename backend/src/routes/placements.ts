import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { Placement } from '../types/database';

export async function placementRoutes(fastify: FastifyInstance) {
    // POST /placements
    fastify.post('/placements', async (request: FastifyRequest<{
        Body: {
            advertiserId?: string;
            publisherId?: string;
            sendId?: string;
            priceCpc?: number;
        }
    }>, reply: FastifyReply) => {
        const { advertiserId, publisherId, sendId, priceCpc } = request.body;
        if (!advertiserId || !publisherId || !sendId || priceCpc === undefined) {
            return reply.status(400).send({ error: 'Missing required fields' });
        }
        if (typeof priceCpc !== 'number' || priceCpc < 0) {
            return reply.status(400).send({ error: 'priceCpc must be a non-negative number' });
        }
        // Validate FKs
        const [adv, pub, send] = await Promise.all([
            supabase.from('advertisers').select('id').eq('id', advertiserId).single(),
            supabase.from('publishers').select('id').eq('id', publisherId).single(),
            supabase.from('newsletter_sends').select('id').eq('id', sendId).single(),
        ]);
        if (adv.error || !adv.data) return reply.status(400).send({ error: 'Invalid advertiserId' });
        if (pub.error || !pub.data) return reply.status(400).send({ error: 'Invalid publisherId' });
        if (send.error || !send.data) return reply.status(400).send({ error: 'Invalid sendId' });
        // Unique combo check
        const { data: existing, error: uniqueErr } = await supabase
            .from('placements')
            .select('id')
            .eq('advertiserId', advertiserId)
            .eq('publisherId', publisherId)
            .eq('sendId', sendId)
            .is('deleted_at', null)
            .single();
        if (existing) {
            return reply.status(409).send({ error: 'Placement with this advertiserId, publisherId, and sendId already exists' });
        }
        // Insert
        const { data, error } = await supabase
            .from('placements')
            .insert({ advertiserId, publisherId, sendId, priceCpc })
            .select()
            .single();
        if (error) {
            if (error.code === '23505') {
                return reply.status(409).send({ error: 'Duplicate placement' });
            }
            return reply.status(500).send({ error: 'Failed to create placement' });
        }
        return reply.status(201).send(data);
    });

    // GET /placements
    fastify.get('/placements', async (request: FastifyRequest<{
        Querystring: {
            advertiserId?: string;
            publisherId?: string;
            sendId?: string;
        }
    }>, reply: FastifyReply) => {
        let query = supabase.from('placements').select('*').is('deleted_at', null);
        const { advertiserId, publisherId, sendId } = request.query;
        if (advertiserId) query = query.eq('advertiserId', advertiserId);
        if (publisherId) query = query.eq('publisherId', publisherId);
        if (sendId) query = query.eq('sendId', sendId);
        const { data, error } = await query;
        if (error) return reply.status(500).send({ error: 'Failed to fetch placements' });
        return reply.send(data);
    });

    // GET /placements/:id
    fastify.get('/placements/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { data, error } = await supabase.from('placements').select('*').eq('id', id).is('deleted_at', null).single();
        if (error || !data) return reply.status(404).send({ error: 'Placement not found' });
        return reply.send(data);
    });

    // PATCH /placements/:id
    fastify.patch('/placements/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: { priceCpc?: number; sendId?: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { priceCpc, sendId } = request.body;
        if (priceCpc === undefined && !sendId) {
            return reply.status(400).send({ error: 'At least one field (priceCpc, sendId) must be provided' });
        }
        const update: any = {};
        if (priceCpc !== undefined) {
            if (typeof priceCpc !== 'number' || priceCpc < 0) {
                return reply.status(400).send({ error: 'priceCpc must be a non-negative number' });
            }
            update.priceCpc = priceCpc;
        }
        if (sendId) {
            // Validate sendId exists
            const { data: send, error: sendErr } = await supabase.from('newsletter_sends').select('id').eq('id', sendId).single();
            if (sendErr || !send) return reply.status(400).send({ error: 'Invalid sendId' });
            update.sendId = sendId;
        }
        // Unique combo check if sendId is changing
        if (sendId) {
            const { data: existing } = await supabase
                .from('placements')
                .select('id')
                .eq('advertiserId', undefined)
                .eq('publisherId', undefined)
                .eq('sendId', sendId)
                .neq('id', id)
                .is('deleted_at', null)
                .single();
            if (existing) {
                return reply.status(409).send({ error: 'Placement with this advertiserId, publisherId, and sendId already exists' });
            }
        }
        const { data, error } = await supabase
            .from('placements')
            .update(update)
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();
        if (error || !data) return reply.status(404).send({ error: 'Placement not found or update failed' });
        return reply.send(data);
    });

    // DELETE /placements/:id (soft delete)
    fastify.delete('/placements/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        // Optional: check for campaigns referring to this placement
        // const { data: campaigns } = await supabase.from('campaigns').select('id').eq('placementId', id).limit(1);
        // if (campaigns && campaigns.length > 0) {
        //     return reply.status(409).send({ error: 'Cannot delete placement: it is linked to campaigns' });
        // }
        const { error } = await supabase
            .from('placements')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null);
        if (error) return reply.status(500).send({ error: 'Failed to delete placement' });
        return reply.status(204).send();
    });
} 