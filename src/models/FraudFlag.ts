
import mongoose, { Schema, Document } from 'mongoose';

export interface IFraudFlag extends Document {
  transferId: mongoose.Types.ObjectId;
  score: number;
  reason: string;
  reviewed: boolean;
}

const FraudFlagSchema: Schema = new Schema({
  transferId: { type: Schema.Types.ObjectId, ref: 'Transfer', required: true, unique: true },
  score: { type: Number, required: true },
  reason: { type: String },
  reviewed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IFraudFlag>('FraudFlag', FraudFlagSchema);