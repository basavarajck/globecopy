
import mongoose from 'mongoose';
import Transfer from '../models/Transfer';
import Pool from '../models/Pool';
import User from '../models/User';
import Receiver from '../models/Receiver';
import logger from '../config/logger';
import { io } from '../app';
import * as pspService from './psp.service';
import * as payoutService from './payout.service';

// Helper to get exchange rate (mock)
const getExchangeRate = (source: string, target: string): number => {
  const rates: Record<string, number> = {
    'USD-EUR': 0.92,
    'EUR-USD': 1.09,
    'USD-MXN': 17.50,
    'MXN-USD': 0.057,
    'USD-USD': 1,
  };
  return rates[`${source}-${target}`] || 1;
};

export const createTransfer = async (
  senderId: string,
  receiverId: string,
  sourceAmount: number,
  sourceCurrency: string,
  targetCurrency: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    logger.info(`[Transfer] Initiating creation for Sender: ${senderId}`);

    const sender = await User.findById(senderId).session(session);
    if (!sender) throw new Error('Sender not found');
    if (sender.kycStatus !== 'VERIFIED') throw new Error('Sender KYC is not verified');

    const receiver = await Receiver.findById(receiverId).session(session);
    if (!receiver) throw new Error('Receiver not found');

    const exchangeRate = getExchangeRate(sourceCurrency, targetCurrency);
    const targetAmount = sourceAmount * exchangeRate;
    const fee = sourceAmount * 0.02;

    const transfer = new Transfer({
      senderId,
      receiverId,
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
      exchangeRate,
      fee,
      status: 'CREATED'
    });

    await transfer.save({ session });

    await Pool.findOneAndUpdate(
      { country: 'Global', currency: sourceCurrency, type: 'SENDER' },
      { $inc: { reserved: sourceAmount } },
      { new: true, upsert: true, session }
    );

    await session.commitTransaction();
    return transfer;

  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`[Transfer] Create Failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const payTransfer = async (transferId: string) => {
    const transfer = await Transfer.findById(transferId);
    if(!transfer) throw new Error("Transfer not found");
    if(transfer.status !== 'CREATED') throw new Error("Transfer already paid or processing");

    // Call PSP Service to get payment URL/Status
    return await pspService.initiatePayment(transferId, transfer.sourceAmount, transfer.sourceCurrency);
};

export const confirmPaymentAndPoolCredit = async (transferId: string, pspTransactionId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`[Transfer] Confirming Payment: ${transferId}`);

    const transfer = await Transfer.findById(transferId).session(session);
    if (!transfer) throw new Error('Transfer not found');
    // Idempotency check
    if (transfer.status === 'PAID' || transfer.status === 'PAYOUT_TRIGGERED' || transfer.status === 'COMPLETED') {
        await session.abortTransaction();
        return transfer; 
    }

    transfer.status = 'PAID';
    transfer.pspTransactionId = pspTransactionId;
    await transfer.save({ session });

    await Pool.findOneAndUpdate(
      { country: 'Global', currency: transfer.sourceCurrency, type: 'SENDER' },
      { $inc: { reserved: -transfer.sourceAmount, balance: transfer.sourceAmount } },
      { session }
    );

    await session.commitTransaction();

    io.to(transfer.senderId.toString()).emit('transfer_update', { 
      transferId: transfer._id, 
      status: 'PAID' 
    });

    return transfer;
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`[Transfer] Confirm Payment Failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const triggerPayout = async (transferId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let transfer;
  let receiver;

  try {
    logger.info(`[Transfer] Triggering Payout: ${transferId}`);

    transfer = await Transfer.findById(transferId).session(session);
    if (!transfer) throw new Error('Transfer not found');
    
    // Idempotency / State check
    if (transfer.status !== 'PAID') {
        // If already triggered, just return
        if(transfer.status === 'PAYOUT_TRIGGERED') {
            await session.abortTransaction();
            return transfer;
        }
        throw new Error(`Invalid state for payout: ${transfer.status}`);
    }

    receiver = await Receiver.findById(transfer.receiverId).session(session);
    if (!receiver) throw new Error("Receiver details missing");

    // 1. Debit Sender Pool
    await Pool.findOneAndUpdate(
      { country: 'Global', currency: transfer.sourceCurrency, type: 'SENDER' },
      { $inc: { balance: -transfer.sourceAmount } },
      { session }
    );

    // 2. Credit Receiver Pool (Reserve)
    const receiverPool = await Pool.findOneAndUpdate(
      { currency: transfer.targetCurrency, type: 'RECEIVER' }, 
      { $inc: { reserved: transfer.targetAmount } },
      { new: true, session }
    );

    if (!receiverPool) throw new Error(`No liquidity pool found for ${transfer.targetCurrency}`);

    // 3. Update State
    transfer.status = 'PAYOUT_TRIGGERED';
    await transfer.save({ session });

    await session.commitTransaction();
    
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`[Transfer] Trigger Payout DB Logic Failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }

  // 4. Call External Payout Provider (Outside DB Transaction)
  try {
      if(transfer && receiver) {
          await payoutService.executePayout(transfer as any, receiver);
          
          io.to(transfer.receiverId.toString()).emit('payout_ready', {
              transferId: transfer._id,
              status: 'PAYOUT_TRIGGERED'
          });
      }
  } catch(e: any) {
      logger.error(`[Transfer] External Payout Call Failed: ${e.message}`);
      // In real world: Update DB status to 'FAILED' or 'RETRY_NEEDED' here
  }

  return transfer;
};

export const completeTransfer = async (transferId: string, payoutTransactionId?: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`[Transfer] Completing Payout: ${transferId}`);

    const transfer = await Transfer.findById(transferId).session(session);
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== 'PAYOUT_TRIGGERED') {
         await session.abortTransaction();
         return transfer; // Idempotency
    }

    // 1. Finalize Pool Operations (Release Reserve, Debit Balance)
    await Pool.findOneAndUpdate(
      { currency: transfer.targetCurrency, type: 'RECEIVER' },
      { $inc: { reserved: -transfer.targetAmount, balance: -transfer.targetAmount } },
      { new: true, session }
    );

    // 2. Update Status
    transfer.status = 'COMPLETED';
    if (payoutTransactionId) transfer.payoutTransactionId = payoutTransactionId;
    await transfer.save({ session });

    await session.commitTransaction();

    io.to(transfer.senderId.toString()).emit('transfer_update', { 
      transferId: transfer._id, 
      status: 'COMPLETED' 
    });
    
    io.to(transfer.receiverId.toString()).emit('payout_completed', { 
      transferId: transfer._id,
      amount: transfer.targetAmount
    });

    return transfer;
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`[Transfer] Complete Payout Failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const claimTransfer = async (transferId: string, receiverUserId: string) => {
    // For manual claims (Cash pickup), we trigger completion directly
    return completeTransfer(transferId, `MANUAL_CLAIM_${Date.now()}`);
};