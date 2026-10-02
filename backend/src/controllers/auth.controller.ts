import { FastifyReply } from 'fastify';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

export const adminLogin = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { phone, password } = request.body as any;
    
    if (!phone || !password) {
      return reply.status(400).send({ success: false, message: 'Phone and password required' });
    }

    const user = await User.findOne({ phone, role: 'ADMIN' });
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id as string);
    return reply.send({ success: true, token, user: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const workerLogin = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { workerId, phone, password } = request.body as any;
    
    const query = workerId ? { workerId, role: 'WORKER' } : { phone, role: 'WORKER' };
    const user = await User.findOne(query);
    
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id as string);
    return reply.send({ success: true, token, user: { _id: user._id, name: user.name, role: user.role, workerId: user.workerId, isFirstLogin: user.isFirstLogin } });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const registerWorker = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { name, phone, email, workerId } = request.body as any;

    const existingUser = await User.findOne({ $or: [{ phone }, { workerId }] });
    if (existingUser) {
      return reply.status(400).send({ success: false, message: 'Worker with this phone or ID already exists' });
    }

    // Generate initial password: FIRST 3 LETTERS OF NAME + LAST 3 DIGITS OF PHONE NUMBER
    const first3Letters = name.substring(0, 3).toUpperCase();
    const last3Digits = phone.substring(phone.length - 3);
    const initialPassword = `${first3Letters}${last3Digits}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    const newUser = new User({
      name,
      phone,
      email,
      workerId,
      passwordHash,
      role: 'WORKER',
      isFirstLogin: true,
      isActive: true,
    });

    await newUser.save();

    return reply.status(201).send({
      success: true,
      message: 'Worker registered successfully',
      data: {
        workerId: newUser.workerId,
        initialPassword
      }
    });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const changePassword = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { oldPassword, newPassword } = request.body as any;
    const userId = request.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return reply.status(400).send({ success: false, message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.isFirstLogin = false;
    await user.save();

    return reply.send({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const seedAdmin = async (request: AuthRequest, reply: FastifyReply) => {
  // Only for dev
  try {
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      return reply.send({ success: false, message: 'Admin already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    const admin = new User({
      name: 'Super Admin',
      phone: '0000000000',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: false
    });
    
    await admin.save();
    return reply.send({ success: true, message: 'Admin seeded (0000000000 / admin123)' });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};
