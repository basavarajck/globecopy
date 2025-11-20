
import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as kycController from '../controllers/kyc.controller';
import * as transferController from '../controllers/transfer.controller';
import * as receiverController from '../controllers/receiver.controller';
import * as adminController from '../controllers/admin.controller';
import * as webhookController from '../controllers/webhook.controller';
import { protect, adminOnly, receiverOnly } from '../middleware/auth';

const router = express.Router();

// AUTH
router.post('/auth/sender/register', authController.registerSender);
router.post('/auth/sender/login', authController.loginSender);
router.post('/auth/receiver/login', authController.loginReceiver);
router.post('/auth/admin/login', authController.loginAdmin);

// KYC
router.post('/kyc/verify', protect, kycController.verifyKyc);

// TRANSFER (Sender)
router.post('/transfer', protect, transferController.initiateTransfer);
router.post('/transfer/pay', protect, transferController.payTransfer);
router.get('/transfer/status/:id', protect, transferController.getTransferStatus);
router.get('/transfer/history', protect, transferController.getTransferHistory);
router.post('/receivers', protect, transferController.createReceiver); // Helper

// RECEIVER
router.post('/receiver/verify-kyc', protect, receiverOnly, receiverController.verifyReceiverKyc);
router.get('/receiver/transfers', protect, receiverOnly, receiverController.getReceiverTransfers);
router.post('/receiver/claim', protect, receiverOnly, receiverController.claimFunds);

// ADMIN
router.get('/admin/pool-balances', protect, adminOnly, adminController.getPoolBalances);
router.get('/admin/transactions', protect, adminOnly, adminController.getTransactions);
router.get('/admin/flags', protect, adminOnly, adminController.getFlags);
router.get('/admin/settlements', protect, adminOnly, adminController.getSettlements);
router.post('/admin/settlement/run', protect, adminOnly, adminController.runSettlement);

// NOTIFICATIONS / WEBHOOKS
router.post('/psp/webhook', webhookController.handlePspWebhook);
router.post('/payout/webhook', webhookController.handlePayoutWebhook);

export default router;