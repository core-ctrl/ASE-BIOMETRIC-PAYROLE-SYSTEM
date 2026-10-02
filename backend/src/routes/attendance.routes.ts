import { FastifyInstance } from 'fastify';
import { getAttendance, getWorkerAttendance, getTodayAttendance, updateAttendance } from '../controllers/attendance.controller';
import { requireAdmin, authenticate } from '../middleware/auth.middleware';

export default async function attendanceRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [requireAdmin] }, getAttendance);
  server.get('/today', { preHandler: [requireAdmin] }, getTodayAttendance);
  server.get('/worker/:workerId', { preHandler: [authenticate] }, getWorkerAttendance);
  server.put('/:id', { preHandler: [requireAdmin] }, updateAttendance);
}
