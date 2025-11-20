
import express, { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Transfer from '../models/Transfer';
import * as transferService from '../services/transfer.service';
import User from '../models/User';

export const verifyReceiverKyc = async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.kycStatus = 'VERIFIED';
      await user.save();
      res.json({ message: 'Receiver Verified', status: 'VERIFIED' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReceiverTransfers = async (req: any, res: any) => {
  try {
    // Find transfers where this user is the receiver
    // Note: Schema has receiverId as ObjectId ref to 'Receiver', not 'User'.
    // We need to find the Receiver doc first or assume simplified user link
    const transfers = await Transfer.find({}).populate({
        path: 'receiverId',
        match: { userId: req.user.id }
    });
    
    // Filter out null populated fields if any
    const myTransfers = transfers.filter(t => t.receiverId !== null);
    res.json(myTransfers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const claimFunds = async (req: any, res: any) => {
  try {
    const { transferId } = req.body;
    const transfer = await transferService.claimTransfer(transferId, req.user.id);
    res.json({ message: 'Funds Claimed', transfer });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};