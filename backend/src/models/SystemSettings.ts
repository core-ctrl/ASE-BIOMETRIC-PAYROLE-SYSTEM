import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  companyName: string;
  hourlyRate: number;
  currency: string;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    companyName: { type: String, default: 'Biometric Payroll System' },
    hourlyRate: { type: Number, default: 1000 },
    currency: { type: String, default: 'INR' },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
