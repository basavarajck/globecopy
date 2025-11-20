
import axios from 'axios';
import logger from '../config/logger';

export const initiatePayment = async (transferId: string, amount: number, currency: string) => {
  try {
    logger.info(`[PSP] Initiating payment for Transfer ${transferId}`);
    
    // Lazy load env vars inside the function
    const PSP_URL = process.env.PSP_URL || 'http://localhost:5001';
    const PORT = process.env.PORT || 5000;

    // Call external PSP
    const response = await axios.post(`${PSP_URL}/psp/pay`, {
      transferId,
      amount,
      currency,
      webhookUrl: `http://localhost:${PORT}/api/v1/psp/webhook`
    });

    return response.data;
  } catch (error: any) {
    logger.error(`[PSP] Payment Initiation Failed: ${error.message}`);
    throw new Error('Payment service unavailable');
  }
};