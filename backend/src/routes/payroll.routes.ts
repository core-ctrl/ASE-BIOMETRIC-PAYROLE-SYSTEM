import { FastifyInstance } from 'fastify';
import { getPayroll, getWorkerPayroll, generatePayroll } from '../controllers/payroll.controller';
import { requireAdmin, authenticate } from '../middleware/auth.middleware';

export default async function payrollRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [requireAdmin] }, getPayroll);
  server.get('/:workerId', { preHandler: [authenticate] }, getWorkerPayroll);
  server.post('/generate', { preHandler: [requireAdmin] }, generatePayroll);
}
