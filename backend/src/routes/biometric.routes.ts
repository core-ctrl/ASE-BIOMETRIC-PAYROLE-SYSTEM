import { FastifyInstance } from 'fastify';
import { registerFace, recognizeFace } from '../controllers/biometric.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export default async function biometricRoutes(server: FastifyInstance) {
  server.post('/register', { preHandler: [requireAdmin] }, registerFace);
  // Recognize doesn't need auth, or maybe a generic app token if it's a public terminal
  server.post('/recognize', recognizeFace);
}
