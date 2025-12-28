import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';

const redis = new Redis({ host: 'localhost', port: 6379 });

export const rateLimiter = async (request: FastifyRequest, reply: FastifyReply) => {
  const appId = (request as any).appId; 
  const limit = 5; 
  
  const key = `rate_limit:${appId}`;
  

  const currentUsage = await redis.incr(key);
  
  if (currentUsage === 1) {
    await redis.expire(key, 60); 
  }

  if (currentUsage > limit) {
    return reply.status(429).send({
      error: "Limite de quota atteinte",
      message: "Passez à la version Pro pour envoyer plus de notifications.",
      resetInSeconds: await redis.ttl(key)
    });
  }
};