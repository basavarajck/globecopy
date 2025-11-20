
import mongoose from 'mongoose';
import Transfer from '../models/Transfer';
import Settlement from '../models/Settlement';
import * as blockchainService from './blockchain.service';
import logger from '../config/logger';

export const performSettlement = async (adminId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`[Settlement] Starting batch run by Admin: ${adminId}`);

    // 1. Find eligible transfers (Completed but not yet settled on-chain)
    const transfers = await Transfer.find({ 
      status: 'COMPLETED', 
      blockchainHash: { $exists: false } 
    }).session(session);

    if (transfers.length === 0) {
      logger.info('[Settlement] No pending transfers to settle.');
      await session.abortTransaction();
      return null;
    }

    // 2. Aggregate Totals
    const totalAmount = transfers.reduce((sum, t) => sum + t.sourceAmount, 0);
    // Calculate weighted average FX rate for the batch record
    const totalTarget = transfers.reduce((sum, t) => sum + t.targetAmount, 0);
    const avgFxRate = totalTarget / totalAmount; 
    const timestamp = Math.floor(Date.now() / 1000);

    // 3. Call Blockchain Service (Outside transaction typically, but here we assume rapid execution)
    // Note: If blockchain fails, we rollback DB.
    let txHash: string;
    try {
        txHash = await blockchainService.recordSettlement({
            totalAmount,
            fxRate: avgFxRate,
            timestamp
        });
    } catch (chainError) {
        logger.error('[Settlement] Blockchain write failed. Aborting DB transaction.');
        throw chainError;
    }

    // 4. Create Settlement Record
    const settlement = new Settlement({
      adminId,
      transferIds: transfers.map(t => t._id),
      totalAmountUSD: totalAmount,
      txHash: txHash,
      status: 'CONFIRMED'
    });

    await settlement.save({ session });

    // 5. Update Transfers with Hash to mark them as settled
    await Transfer.updateMany(
      { _id: { $in: transfers.map(t => t._id) } },
      { $set: { blockchainHash: txHash } },
      { session }
    );

    await session.commitTransaction();
    logger.info(`[Settlement] Batch ${settlement._id} completed. TX: ${txHash}`);
    
    return settlement;

  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`[Settlement] Error: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};