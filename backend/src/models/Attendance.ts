import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  workerId: string; // references User workerId or _id
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  punchIn: Date;
  punchOut?: Date;
  workingMinutes?: number;
  hourlyRate: number;
  dailySalary?: number;
  status: 'WORKING' | 'COMPLETED' | 'MANUALLY_ADJUSTED';
  adjustmentHistory?: {
    changedBy: Types.ObjectId;
    previousPunchOut?: Date;
    newPunchOut: Date;
    reason?: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    workerId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    punchIn: { type: Date, required: true },
    punchOut: { type: Date },
    workingMinutes: { type: Number },
    hourlyRate: { type: Number, required: true },
    dailySalary: { type: Number },
    status: { 
      type: String, 
      enum: ['WORKING', 'COMPLETED', 'MANUALLY_ADJUSTED'],
      default: 'WORKING'
    },
    adjustmentHistory: [{
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      previousPunchOut: { type: Date },
      newPunchOut: { type: Date },
      reason: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
