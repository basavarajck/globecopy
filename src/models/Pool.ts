
import mongoose, { Schema, Document } from 'mongoose';

export interface IPool extends Document {
  currency: string;
  country: string;
  type: 'SENDER' | 'RECEIVER'; 
  balance: number;
  reserved: number;
}

// Index for quick lookup during transfer atomic checks
const PoolSchema: Schema = new Schema({
  currency: { type: String, required: true },
  country: { type: String, required: true },
  type: { type: String, enum: ['SENDER', 'RECEIVER'], required: true },
  balance: { type: Number, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

PoolSchema.index({ country: 1, currency: 1, type: 1 }, { unique: true });

export default mongoose.model<IPool>('Pool', PoolSchema);