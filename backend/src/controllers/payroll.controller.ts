import { FastifyReply } from 'fastify';
import { AuthRequest } from '../middleware/auth.middleware';
import { Payroll } from '../models/Payroll';
import { Attendance } from '../models/Attendance';
import { User } from '../models/User';

export const getPayroll = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { month, year } = request.query as any;
    let query: any = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query).populate('userId', 'name workerId phone');
    return reply.send({ success: true, data: payrolls });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const getWorkerPayroll = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { workerId } = request.params as any;
    const { month, year } = request.query as any;

    if (request.user?.role === 'WORKER' && request.user.workerId !== workerId) {
      return reply.status(403).send({ success: false, message: 'Access denied' });
    }

    let query: any = { workerId };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query);
    return reply.send({ success: true, data: payrolls });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};

export const generatePayroll = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const { month, year } = request.body as any;
    if (!month || !year) {
      return reply.status(400).send({ success: false, message: 'Month and year are required' });
    }

    const workers = await User.find({ role: 'WORKER' });
    const results = [];

    for (const worker of workers) {
      // Find all completed attendances for this worker in this month/year
      // We can construct start and end dates
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const attendances = await Attendance.find({
        workerId: worker.workerId,
        date: { $gte: startDateStr, $lte: endDateStr },
        status: { $in: ['COMPLETED', 'MANUALLY_ADJUSTED'] }
      });

      if (attendances.length === 0) continue;

      let totalWorkingMinutes = 0;
      let totalGrossSalary = 0;
      let totalWorkingDays = attendances.length;

      for (const att of attendances) {
        if (att.workingMinutes) totalWorkingMinutes += att.workingMinutes;
        if (att.dailySalary) totalGrossSalary += att.dailySalary;
      }

      const totalWorkingHours = totalWorkingMinutes / 60;
      
      // Upsert payroll
      const payroll = await Payroll.findOneAndUpdate(
        { userId: worker._id, month, year },
        {
          userId: worker._id,
          workerId: worker.workerId,
          month,
          year,
          totalWorkingMinutes,
          totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
          totalWorkingDays,
          hourlyRate: attendances[0].hourlyRate, // Approx
          grossSalary: parseFloat(totalGrossSalary.toFixed(2)),
          status: 'CALCULATED'
        },
        { upsert: true, new: true }
      );

      results.push(payroll);
    }

    return reply.send({ success: true, message: 'Payroll generated successfully', data: results });
  } catch (error) {
    return reply.status(500).send({ success: false, message: 'Server error', error });
  }
};
