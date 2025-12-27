import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/health', async () => {
  return { status: 'OK', message: 'Service de Notification Opérationnel' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(" Serveur démarré sur http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();