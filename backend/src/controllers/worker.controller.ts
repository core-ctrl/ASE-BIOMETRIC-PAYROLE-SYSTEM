import { FastifyReply } from 'fastify';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';

export const getWorkers = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const workers = await User.find({ role: 'WORKER' }).select('-passwordHash');
    return reply.send({ success: true, data: workers });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const getWorkerById = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const worker = await User.findById(id).select('-passwordHash');
    
    if (!worker || worker.role !== 'WORKER') {
      return reply.status(404).send({ success: false, message: 'Worker not found' });
    }
    
    return reply.send({ success: true, data: worker });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const updateWorker = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { name, phone, email, isActive } = request.body as any;
    
    const worker = await User.findById(id);
    if (!worker || worker.role !== 'WORKER') {
      return reply.status(404).send({ success: false, message: 'Worker not found' });
    }
    
    if (name !== undefined) worker.name = name;
    if (phone !== undefined) worker.phone = phone;
    if (email !== undefined) worker.email = email;
    if (isActive !== undefined) worker.isActive = isActive;
    
    await worker.save();
    return reply.send({ success: true, message: 'Worker updated successfully', data: worker });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const deleteWorker = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const worker = await User.findById(id);
    
    if (!worker || worker.role !== 'WORKER') {
      return reply.status(404).send({ success: false, message: 'Worker not found' });
    }
    
    // Soft delete
    worker.isActive = false;
    await worker.save();
    
    return reply.send({ success: true, message: 'Worker deleted (deactivated) successfully' });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};
