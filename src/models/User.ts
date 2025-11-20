
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN' | 'RECEIVER';
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  country: string;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN', 'RECEIVER'], default: 'USER' },
  kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  country: { type: String, required: true },
}, { timestamps: true });

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);