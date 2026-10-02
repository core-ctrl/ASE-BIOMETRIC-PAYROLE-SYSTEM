import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

const server = Fastify({ logger: true });

// Register plugins
server.register(cors, { 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' 
});

import authRoutes from './routes/auth.routes';
import biometricRoutes from './routes/biometric.routes';
import attendanceRoutes from './routes/attendance.routes';
import workerRoutes from './routes/worker.routes';
import payrollRoutes from './routes/payroll.routes';
import adminRoutes from './routes/admin.routes';

// Routes
server.get('/', async (request, reply) => {
  return { status: 'Biometric Payroll System API is running' };
});

server.register(authRoutes, { prefix: '/api/auth' });
server.register(biometricRoutes, { prefix: '/api/biometric' });
server.register(attendanceRoutes, { prefix: '/api/attendance' });
server.register(workerRoutes, { prefix: '/api/workers' });
server.register(payrollRoutes, { prefix: '/api/payroll' });
server.register(adminRoutes, { prefix: '/api/admin' });

// Start Server
const start = async () => {
  try {
    await connectDB();
    const port = parseInt(process.env.PORT || '5000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
