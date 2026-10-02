import { FastifyReply } from 'fastify';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Attendance } from '../models/Attendance';
import { SystemSettings } from '../models/SystemSettings';
import { format } from 'date-fns';

export const getDashboardStats = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const totalWorkers = await User.countDocuments({ role: 'WORKER', isActive: true });
    
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    
    const todayAttendances = await Attendance.find({ date: todayStr });
    
    const presentToday = todayAttendances.length;
    const currentlyWorking = todayAttendances.filter(a => a.status === 'WORKING').length;
    const completedToday = todayAttendances.filter(a => a.status === 'COMPLETED' || a.status === 'MANUALLY_ADJUSTED').length;
    
    let totalHoursToday = 0;
    let estimatedPayroll = 0;
    
    todayAttendances.forEach(att => {
      if (att.workingMinutes) {
        totalHoursToday += att.workingMinutes / 60;
      }
      if (att.dailySalary) {
        estimatedPayroll += att.dailySalary;
      }
    });

    return reply.send({
      success: true,
      data: {
        totalWorkers,
        presentToday,
        currentlyWorking,
        completedToday,
        totalHoursToday: parseFloat(totalHoursToday.toFixed(2)),
        estimatedPayroll: parseFloat(estimatedPayroll.toFixed(2))
      }
    });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const getSettings = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return reply.send({ success: true, data: settings });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const updateSettings = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { hourlyRate, companyName } = request.body as any;
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings();
    }
    
    if (hourlyRate !== undefined) settings.hourlyRate = hourlyRate;
    if (companyName !== undefined) settings.companyName = companyName;
    
    await settings.save();
    return reply.send({ success: true, message: 'Settings updated', data: settings });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};
