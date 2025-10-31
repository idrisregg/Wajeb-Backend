import Fastify from 'fastify';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from '@fastify/cors';
import userRoutes from './routes/user.routes.js';
import fileRoutes from './routes/file.routes.js';
import fastifyMultipart from '@fastify/multipart';
import FileCleanupService from './services/fileCleanupService.js';
import jwt from "./plugins/jwt.js";

dotenv.config();

const fastify = Fastify({
    logger: true
});

fastify.register(cors, {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
});

let cleanupService = null;

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB, {
            dbName: 'Wajeb'
        });
        console.log('Connected to DB');

        await fastify.register(fastifyMultipart, {
            limits: {
                fileSize: 10 * 1024 * 1024,
                files: 1
            }
        });
        
        await fastify.register(jwt);
        await fastify.register(userRoutes, { prefix: 'api/users' });
        await fastify.register(fileRoutes, { prefix: 'api/files' });

        fastify.get('/api/admin/cleanup-stats', {
            onRequest: [fastify.jwtAuth]
        }, async (req, reply) => {
            try {
                if (!cleanupService) {
                    return reply.status(503).send({ error: 'Cleanup service not initialized' });
                }
                const stats = await cleanupService.getCleanupStats();
                reply.send(stats);
            } catch (error) {
                reply.status(500).send({ error: 'Failed to get cleanup stats' });
            }
        });

        fastify.post('/api/admin/force-cleanup', {
            onRequest: [fastify.jwtAuth]
        }, async (req, reply) => {
            try {
                if (!cleanupService) {
                    return reply.status(503).send({ error: 'Cleanup service not initialized' });
                }
                await cleanupService.forceCleanup();
                reply.send({ message: 'Cleanup initiated successfully' });
            } catch (error) {
                reply.status(500).send({ error: 'Failed to initiate cleanup' });
            }
        });

        const port = process.env.PORT || 3000;
        const host = '0.0.0.0';
        await fastify.listen({ port, host });
        fastify.log.info(`Server running on ${fastify.server.address().port}`);
        
        cleanupService = new FileCleanupService();
        console.log('File cleanup service initialized');
        
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    console.log('\nGracefully shutting down...');
    await fastify.close();
    await mongoose.connection.close();
    console.log('Server and database connections closed');
    process.exit(0);
});

start();

export { fastify };