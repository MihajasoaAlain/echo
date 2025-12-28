import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const authenticateApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: "Clé API manquante" });
  }

  const app = await prisma.app.findUnique({
    where: { apiKey }
  });

  if (!app || !app.isActive) {
    return reply.status(403).send({ error: "Clé API invalide ou inactive" });
  }

  (request as any).appId = app.id;
};