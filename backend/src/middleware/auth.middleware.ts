import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends FastifyRequest {
  user?: IUser;
}

export const authenticate = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      return reply.status(401).send({ success: false, message: 'User not found' });
    }
    
    if (!user.isActive) {
      return reply.status(403).send({ success: false, message: 'User account is disabled' });
    }

    request.user = user;
  } catch (error) {
    return reply.status(401).send({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (request: AuthRequest, reply: FastifyReply) => {
  await authenticate(request, reply);
  if (request.user && request.user.role !== 'ADMIN') {
    return reply.status(403).send({ success: false, message: 'Admin access required' });
  }
};

export const requireWorker = async (request: AuthRequest, reply: FastifyReply) => {
  await authenticate(request, reply);
  if (request.user && request.user.role !== 'WORKER') {
    return reply.status(403).send({ success: false, message: 'Worker access required' });
  }
};
