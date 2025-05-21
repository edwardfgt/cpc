import Fastify from 'fastify';
import dotenv from 'dotenv';
import { campaignRoutes } from './routes/campaigns';
import { clickRoutes } from './routes/clicks';
import { advertiserRoutes } from './routes/advertisers';
import { publisherRoutes } from './routes/publishers';

// Load environment variables
dotenv.config();

// Create Fastify server
const server = Fastify();

// Register routes
server.register(campaignRoutes);
server.register(clickRoutes);
server.register(advertiserRoutes);
server.register(publisherRoutes);

// Start the server
const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running at http://localhost:3000');

        // Hardcoded test link for Beehiiv testing
        const testLink = 'http://localhost:3000/c?cmid=newsletter-test-1&sig=3f5c53f5db16c024f3667d6818b862f91cc524739ec1088d69635e1fff72d258';
        console.log('\n=== Newsletter Test Link ===');
        console.log('Use this link in your newsletter:');
        console.log(testLink);
        console.log('===========================\n');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start(); 