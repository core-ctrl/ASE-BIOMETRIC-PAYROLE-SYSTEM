import { FastifyInstance } from 'fastify';
import { adminLogin, workerLogin, registerWorker, changePassword, seedAdmin } from '../controllers/auth.controller';
import { requireAdmin, authenticate } from '../middleware/auth.middleware';

export default async function authRoutes(server: FastifyInstance) {
  server.post('/admin/login', adminLogin);
  server.post('/worker/login', workerLogin);
  
  server.post('/worker/register', { preHandler: [requireAdmin] }, registerWorker);
  server.post('/change-password', { preHandler: [authenticate] }, changePassword);

  server.post('/seed-admin', seedAdmin); // for dev
}
