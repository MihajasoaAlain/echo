import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { pushNotificationSchema } from './schemas/notification.schema';
import { prisma } from './lib/prisma';
import { authenticateApiKey } from './middleware/auth.middleware';
import { success } from 'zod';
import { id } from 'zod/locales';
import { rateLimiter } from './middleware/rate-limiter.middleware';

const server = Fastify({ logger: true });

const pubClient = new Redis({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

server.register(fastifyIO, {
  cors: {
    origin: "*", 
  },
  adapter: createAdapter(pubClient, subClient)
});


server.ready((err) => {
  if (err) throw err;

  server.io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      socket.join(userId);
      console.log(`Utilisateur connecté : ${userId} (Socket ID: ${socket.id})`);
    }

    socket.on('disconnect', () => {
      console.log(` Utilisateur déconnecté : ${socket.id}`);
    });
  });
});

server.get('/health', async () => {
  return { status: 'OK' };
});

server.post('/api/v1/push',{
  preHandler:[authenticateApiKey,rateLimiter]
},async (request, reply) => {
const data = pushNotificationSchema.parse(request.body);

const appId = (request as any).appId;

const notification = await prisma.notification.create({
  data: {
    ...data,
    appId:appId
  }
});
server.io.to(data.userId).emit('notification', notification);
return {success:true, id:notification.id};
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();