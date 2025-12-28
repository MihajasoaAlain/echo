import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { pushNotificationSchema } from './schemas/notification.schema';
import { prisma } from './lib/prisma';
import { authenticateApiKey } from './middleware/auth.middleware';
import { rateLimiter } from './middleware/rate-limiter.middleware';
import cors from '@fastify/cors';

const server = Fastify({ logger: true });
server.register(cors, {
  origin: true, 
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
});

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

server.get('/api/v1/notifications/:userId',{
  preHandler:[authenticateApiKey]
},async (request, reply) => {
  const { userId } = request.params as { userId: string };

  const notifications = await prisma.notification.findMany({
    where: { userId:userId,
      isRead: false,
     },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return { notifications };
});

// 1. Marquer TOUT comme lu pour un utilisateur
server.patch('/api/v1/notifications/read-all/:userId', {
  preHandler: [authenticateApiKey]
}, async (request, reply) => {
  const { userId } = request.params as { userId: string };

  const result = await prisma.notification.updateMany({
    where: {
      userId: userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return { 
    message: `${result.count} notifications marquées comme lues.`,
    count: result.count 
  };
});

server.patch('/api/v1/notifications/:id/read', {
  preHandler: [authenticateApiKey]
}, async (request, reply) => {
  const { id } = request.params as { id: string };

  try {
    await prisma.notification.update({
      where: { id: id },
      data: { isRead: true }
    });
    return { success: true, message: "Notification mise à jour." };
  } catch (error) {
    reply.status(404).send({ error: "Notification non trouvée." });
  }
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