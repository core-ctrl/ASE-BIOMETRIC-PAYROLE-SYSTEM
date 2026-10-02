import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  workerId?: string;
  passwordHash: string;
  role: 'ADMIN' | 'WORKER';
  faceEmbedding?: number[];
  isFirstLogin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    workerId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'WORKER'], required: true },
    faceEmbedding: { type: [Number] },
    isFirstLogin: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ workerId: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
