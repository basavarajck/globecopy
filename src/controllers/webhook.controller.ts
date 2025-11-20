
import express, { Request, Response } from 'express';
import * as transferService from '../services/transfer.service';
import logger from '../config/logger';
import crypto from 'crypto';

export const handlePspWebhook = async (req: any, res: any) => {
  try {
    const { transferId, pspTransactionId, status, signature } = req.body;
    
    const pspSecret = process.env.PSP_SECRET || 'psp_secret_key';

    // 1. Verify Signature
    const hmac = crypto.createHmac('sha256', pspSecret);
    hmac.update(`${transferId}${status}`);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
        logger.warn(`[Webhook] Invalid PSP Signature for ${transferId}`);
        return res.status(401).json({ message: 'Invalid Signature' });
    }
    
    if (status === 'SUCCESS') {
      logger.info(`[Webhook] PSP Payment Success: ${transferId}`);
      await transferService.confirmPaymentAndPoolCredit(transferId, pspTransactionId);
      await transferService.triggerPayout(transferId);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error(`PSP Webhook Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const handlePayoutWebhook = async (req: any, res: any) => {
  try {
    // EXTRACT payoutRef specifically as requested
    const { transferId, payoutRef, status } = req.body;

    if (status === 'SUCCESS') {
      logger.info(`[Webhook] Payout Provider Success: ${transferId}, Ref: ${payoutRef}`);
      // Complete the transfer logic using the ref from the external bank
      await transferService.completeTransfer(transferId, payoutRef);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error(`Payout Webhook Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};