import { FastifyInstance } from 'fastify';
import { getWorkers, getWorkerById, updateWorker, deleteWorker } from '../controllers/worker.controller';
import { requireAdmin } from '../middleware/auth.middleware';

export default async function workerRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [requireAdmin] }, getWorkers);
  server.get('/:id', { preHandler: [requireAdmin] }, getWorkerById);
  server.put('/:id', { preHandler: [requireAdmin] }, updateWorker);
  server.delete('/:id', { preHandler: [requireAdmin] }, deleteWorker);
}
