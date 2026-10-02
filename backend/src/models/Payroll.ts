import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayroll extends Document {
  userId: Types.ObjectId;
  workerId: string;
  month: number; // 1-12
  year: number;
  totalWorkingMinutes: number;
  totalWorkingHours: number;
  totalWorkingDays: number;
  hourlyRate: number;
  grossSalary: number;
  status: 'CALCULATED' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    totalWorkingMinutes: { type: Number, required: true },
    totalWorkingHours: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true },
    hourlyRate: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    status: { type: String, enum: ['CALCULATED', 'PAID'], default: 'CALCULATED' }
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = mongoose.model<IPayroll>('Payroll', payrollSchema);
