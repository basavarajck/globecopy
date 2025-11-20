
import express, { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as transferService from '../services/transfer.service';
import Transfer from '../models/Transfer';
import Receiver from '../models/Receiver';

export const initiateTransfer = async (req: any, res: any) => {
  try {
    const { receiverId, sourceAmount, sourceCurrency, targetCurrency } = req.body;
    const transfer = await transferService.createTransfer(
      req.user.id, 
      receiverId, 
      sourceAmount, 
      sourceCurrency, 
      targetCurrency
    );
    res.status(201).json(transfer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const payTransfer = async (req: any, res: any) => {
  try {
    const { transferId } = req.body;
    // This now calls the service which hits the external PSP
    const pspResponse = await transferService.payTransfer(transferId);
    res.json({ message: 'Payment Initiated', details: pspResponse });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTransferStatus = async (req: any, res: any) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Not found' });
    res.json(transfer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransferHistory = async (req: any, res: any) => {
  try {
    const transfers = await Transfer.find({ senderId: req.user.id }).sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createReceiver = async (req: any, res: any) => {
  try {
    const receiver = await Receiver.create({ ...req.body, userId: req.user.id });
    res.status(201).json(receiver);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};