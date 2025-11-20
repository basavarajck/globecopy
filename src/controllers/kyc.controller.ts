
import express, { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';

export const verifyKyc = async (req: any, res: any) => {
  try {
    // Mock KYC Verification
    const user = await User.findById(req.user.id);
    if (user) {
      user.kycStatus = 'VERIFIED';
      await user.save();
      res.json({ message: 'KYC Verified Successfully', status: 'VERIFIED' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};