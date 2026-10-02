import { FastifyInstance } from 'fastify';
import { getDashboardStats, getSettings, updateSettings } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export default async function adminRoutes(server: FastifyInstance) {
  server.get('/dashboard', { preHandler: [requireAdmin] }, getDashboardStats);
  server.get('/settings', { preHandler: [requireAdmin] }, getSettings);
  server.put('/settings', { preHandler: [requireAdmin] }, updateSettings);
}
