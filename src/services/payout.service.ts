
import axios from 'axios';
import logger from '../config/logger';
import { ITransfer } from '../models/Transfer';

export const executePayout = async (transfer: ITransfer, receiverDetails: any) => {
  try {
    logger.info(`[Payout] Requesting payout for Transfer ${transfer._id}`);

    // Lazy load env vars to avoid hoisting issues
    const PAYOUT_URL = process.env.PAYOUT_URL || 'http://localhost:5002';
    const PORT = process.env.PORT || 5000;
    const WEBHOOK_HOST = process.env.WEBHOOK_HOST || `http://localhost:${PORT}`;

    // Call external Payout Provider
    const response = await axios.post(`${PAYOUT_URL}/payout/execute`, {
      transferId: transfer._id,
      amount: transfer.targetAmount,
      currency: transfer.targetCurrency,
      accountNumber: receiverDetails.accountNumber,
      bankName: receiverDetails.bankName,
      webhookUrl: `${WEBHOOK_HOST}/api/v1/payout/webhook`
    });

    return response.data;
  } catch (error: any) {
    logger.error(`[Payout] Execution Failed: ${error.message}`);
    // We don't throw here to avoid crashing the main flow, but we log it.
    // In a real app, we might flag the transfer as 'PAYOUT_FAILED'
    return null; 
  }
};