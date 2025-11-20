
import express, { Request, Response } from 'express';
import Pool from '../models/Pool';
import Transfer from '../models/Transfer';
import Settlement from '../models/Settlement';
import FraudFlag from '../models/FraudFlag';
import * as settlementService from '../services/settlement.service';
import { AuthRequest } from '../middleware/auth';

export const getPoolBalances = async (req: any, res: any) => {
  try {
    const pools = await Pool.find({});
    res.json(pools);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactions = async (req: any, res: any) => {
  try {
    const transfers = await Transfer.find({}).sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFlags = async (req: any, res: any) => {
  try {
    const flags = await FraudFlag.find({}).populate('transferId');
    res.json(flags);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettlements = async (req: any, res: any) => {
  try {
    const settlements = await Settlement.find({}).sort({ createdAt: -1 });
    res.json(settlements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const runSettlement = async (req: any, res: any) => {
  try {
    const settlement = await settlementService.performSettlement(req.user.id);
    
    if (!settlement) {
        return res.status(200).json({ message: 'No completed transfers pending settlement.' });
    }

    res.status(201).json({
        message: 'Settlement batch executed successfully',
        data: settlement
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};