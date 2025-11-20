
import mongoose, { Schema, Document } from 'mongoose';

export interface IReceiver extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  country: string;
  currency: string;
  bankName: string;
  accountNumber: string;
  mobileWalletProvider?: string;
  mobileWalletNumber?: string;
}

const ReceiverSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String },
  country: { type: String, required: true },
  currency: { type: String, required: true },
  bankName: { type: String },
  accountNumber: { type: String },
  mobileWalletProvider: { type: String },
  mobileWalletNumber: { type: String },
}, { timestamps: true });

export default mongoose.model<IReceiver>('Receiver', ReceiverSchema);