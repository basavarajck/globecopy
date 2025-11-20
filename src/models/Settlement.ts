
import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlement extends Document {
  adminId: mongoose.Types.ObjectId;
  transferIds: mongoose.Types.ObjectId[];
  totalAmountUSD: number;
  txHash: string;
  status: 'PENDING' | 'CONFIRMED';
}

const SettlementSchema: Schema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transferIds: [{ type: Schema.Types.ObjectId, ref: 'Transfer' }],
  totalAmountUSD: { type: Number, required: true },
  txHash: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED'], default: 'PENDING' }
}, { timestamps: true });

export default mongoose.model<ISettlement>('Settlement', SettlementSchema);