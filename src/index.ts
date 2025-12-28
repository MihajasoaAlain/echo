import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { pushNotificationSchema } from './schemas/notification.schema';
import { prisma } from './lib/prisma';

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
server.post('/api/v1/push', async (request, reply) => {
  try {
    const data = pushNotificationSchema.parse(request.body);

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        priority: data.priority,
        metadata: data.metadata
      }
    });

    server.io.to(data.userId).emit('notification', notification);

    return reply.status(200).send({ success: true, id: notification.id });

  } catch (error: any) {
    console.log(error)
  }
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