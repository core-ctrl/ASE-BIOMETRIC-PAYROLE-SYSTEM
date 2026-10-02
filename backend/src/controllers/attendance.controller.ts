import { FastifyReply } from 'fastify';
import { AuthRequest } from '../middleware/auth.middleware';
import { Attendance } from '../models/Attendance';
import { User } from '../models/User';

export const getAttendance = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const attendances = await Attendance.find().populate('userId', 'name phone workerId').sort({ date: -1 });
    return reply.send({ success: true, data: attendances });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const getWorkerAttendance = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { workerId } = request.params as any;
    
    // Validate if worker is accessing their own data or if user is admin
    if (request.user?.role === 'WORKER' && request.user.workerId !== workerId) {
      return reply.status(403).send({ success: false, message: 'Access denied' });
    }

    const attendances = await Attendance.find({ workerId }).sort({ date: -1 });
    return reply.send({ success: true, data: attendances });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const getTodayAttendance = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const attendances = await Attendance.find({ date: todayStr }).populate('userId', 'name phone workerId');
    return reply.send({ success: true, data: attendances });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const updateAttendance = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { punchOut } = request.body as any;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return reply.status(404).send({ success: false, message: 'Attendance not found' });
    }

    if (punchOut) {
      const newPunchOut = new Date(punchOut);
      const diffMs = newPunchOut.getTime() - attendance.punchIn.getTime();
      
      if (diffMs < 0) {
        return reply.status(400).send({ success: false, message: 'Punch out cannot be before punch in' });
      }

      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = diffMinutes / 60;

      attendance.adjustmentHistory = attendance.adjustmentHistory || [];
      attendance.adjustmentHistory.push({
        changedBy: request.user!._id as any,
        previousPunchOut: attendance.punchOut,
        newPunchOut: newPunchOut,
        timestamp: new Date()
      });

      attendance.punchOut = newPunchOut;
      attendance.workingMinutes = diffMinutes;
      attendance.dailySalary = parseFloat((diffHours * attendance.hourlyRate).toFixed(2));
      attendance.status = 'MANUALLY_ADJUSTED';

      await attendance.save();
    }

    return reply.send({ success: true, message: 'Attendance updated successfully', data: attendance });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};
