
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransfer extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  exchangeRate: number;
  targetAmount: number;
  fee: number;
  status: 'CREATED' | 'PAID' | 'FRAUD_CHECK' | 'PAYOUT_TRIGGERED' | 'COMPLETED' | 'FAILED';
  pspTransactionId?: string;
  payoutTransactionId?: string;
  fraudScore?: number;
  blockchainHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferSchema: Schema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'Receiver', required: true },
  sourceCurrency: { type: String, required: true },
  targetCurrency: { type: String, required: true },
  sourceAmount: { type: Number, required: true },
  exchangeRate: { type: Number, required: true },
  targetAmount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['CREATED', 'PAID', 'FRAUD_CHECK', 'PAYOUT_TRIGGERED', 'COMPLETED', 'FAILED'],
    default: 'CREATED',
    index: true
  },
  pspTransactionId: { type: String },
  payoutTransactionId: { type: String },
  fraudScore: { type: Number, default: 0 },
  blockchainHash: { type: String }
}, { timestamps: true });

export default mongoose.model<ITransfer>('Transfer', TransferSchema);