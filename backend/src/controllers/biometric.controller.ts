import { FastifyReply } from 'fastify';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Attendance } from '../models/Attendance';
import { SystemSettings } from '../models/SystemSettings';
import { endOfDay, startOfDay, format } from 'date-fns';

const calculateEuclideanDistance = (embedding1: number[], embedding2: number[]) => {
  if (embedding1.length !== embedding2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    sum += Math.pow(embedding1[i] - embedding2[i], 2);
  }
  return Math.sqrt(sum);
};

export const registerFace = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { workerId, embedding } = request.body as any;

    if (!workerId || !embedding || !Array.isArray(embedding)) {
      return reply.status(400).send({ success: false, message: 'Invalid data' });
    }

    const worker = await User.findOne({ workerId, role: 'WORKER' });
    if (!worker) {
      return reply.status(404).send({ success: false, message: 'Worker not found' });
    }

    worker.faceEmbedding = embedding;
    await worker.save();

    return reply.send({ success: true, message: 'Face registered successfully' });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const recognizeFace = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { embedding, action } = request.body as any;

    if (!embedding || !Array.isArray(embedding)) {
      return reply.status(400).send({ success: false, message: 'Invalid embedding data' });
    }

    if (!action || !['PUNCH_IN', 'PUNCH_OUT'].includes(action)) {
      return reply.status(400).send({ success: false, message: 'Invalid action specified. Must be PUNCH_IN or PUNCH_OUT.' });
    }

    // Find the matching worker
    const workers = await User.find({ role: 'WORKER', isActive: true, faceEmbedding: { $exists: true, $not: { $size: 0 } } });
    
    let bestMatch = null;
    let minDistance = 0.6; // Threshold for face-api.js euclidean distance (typically 0.6 is good for 128d embeddings)

    for (const worker of workers) {
      const distance = calculateEuclideanDistance(embedding, worker.faceEmbedding!);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = worker;
      }
    }

    if (!bestMatch) {
      return reply.status(401).send({ success: false, errorCode: 'FACE_NOT_RECOGNIZED', message: 'Face not recognized' });
    }

    // Face recognized! Now handle attendance
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    const todayAttendance = await Attendance.findOne({
      userId: bestMatch._id,
      date: todayStr
    });

    // Check system settings for hourly rate
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({ hourlyRate: 1000 });
    }

    if (action === 'PUNCH_IN') {
      if (todayAttendance) {
        return reply.status(400).send({
          success: false,
          errorCode: 'ALREADY_PUNCHED_IN',
          message: "You have already punched in today.",
          data: { workerName: bestMatch.name }
        });
      }

      // PUNCH IN
      const newAttendance = new Attendance({
        workerId: bestMatch.workerId,
        userId: bestMatch._id,
        date: todayStr,
        punchIn: now,
        hourlyRate: settings.hourlyRate,
        status: 'WORKING'
      });
      await newAttendance.save();
      
      return reply.send({
        success: true,
        message: 'Punch-in recorded',
        data: {
          workerName: bestMatch.name,
          workerId: bestMatch.workerId,
          type: 'PUNCH_IN',
          time: now
        }
      });
    } else if (action === 'PUNCH_OUT') {
      if (!todayAttendance) {
        return reply.status(400).send({
          success: false,
          errorCode: 'NOT_PUNCHED_IN',
          message: "You must punch in first before punching out.",
          data: { workerName: bestMatch.name }
        });
      }

      if (todayAttendance.punchOut) {
        return reply.status(400).send({
          success: false,
          errorCode: 'ALREADY_COMPLETED',
          message: "Today's attendance has already been completed.",
          data: { workerName: bestMatch.name }
        });
      }

      // PUNCH OUT
      // Calculate diff in minutes
      const diffMs = now.getTime() - todayAttendance.punchIn.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = diffMinutes / 60;
      
      todayAttendance.punchOut = now;
      todayAttendance.workingMinutes = diffMinutes;
      todayAttendance.dailySalary = parseFloat((diffHours * todayAttendance.hourlyRate).toFixed(2));
      todayAttendance.status = 'COMPLETED';

      await todayAttendance.save();

      return reply.send({
        success: true,
        message: 'Punch-out recorded',
        data: {
          workerName: bestMatch.name,
          workerId: bestMatch.workerId,
          type: 'PUNCH_OUT',
          time: now,
          workingHours: diffHours.toFixed(2),
          dailySalary: todayAttendance.dailySalary
        }
      });
    }

  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};
