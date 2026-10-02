import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDB } from '../src/config/db';
import authRoutes from '../src/routes/auth.routes';
import biometricRoutes from '../src/routes/biometric.routes';
import adminRoutes from '../src/routes/admin.routes';

const app = Fastify({ logger: false });

// Register CORS
app.register(cors, { origin: '*' });

// Register Routes
app.get('/api', async (req, reply) => {
  return { success: true, message: 'API is running on Vercel!' };
});

app.register(authRoutes, { prefix: '/api/auth' });
app.register(biometricRoutes, { prefix: '/api/biometric' });
app.register(adminRoutes, { prefix: '/api/admin' });

let dbConnected = false;

// Export Vercel serverless handler
export default async function handler(req: any, res: any) {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  
  await app.ready();
  app.server.emit('request', req, res);
}
