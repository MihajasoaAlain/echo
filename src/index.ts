import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { pushNotificationSchema } from './schemas/notification.schema';

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

    server.io.to(data.userId).emit('notification', {
      title: data.title,
      message: data.message,
      priority: data.priority,
      metadata: data.metadata,
      timestamp: new Date().toISOString()
    });

    // 3. Réponse de succès
    return reply.status(200).send({
      success: true,
      message: `Notification envoyée à l'utilisateur ${data.userId}`
    });

  } catch (error: any) {
    // Si la validation Zod échoue ou autre erreur
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: error.errors });
    }
    return reply.status(500).send({ error: "Erreur interne du serveur" });
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