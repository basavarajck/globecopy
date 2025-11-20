
import logger from '../config/logger';

export const checkFraud = async (transferDetails: any): Promise<{ score: number; reason: string }> => {
  // Mock AI Logic: Randomly assign high risk to large amounts
  const isHighValue = transferDetails.sourceAmount > 9000;
  const score = isHighValue ? Math.floor(Math.random() * (100 - 80) + 80) : Math.floor(Math.random() * 20);
  
  logger.info(`AI Fraud Check: Amount ${transferDetails.sourceAmount} -> Score ${score}`);
  
  return {
    score,
    reason: score > 50 ? 'Unusual transaction volume detected' : 'Low risk',
  };
};

export const getOptimalRoute = (source: string, destination: string) => {
  // Mock routing logic
  return {
    provider: 'PARTNER_BANK_X',
    estimatedTime: '2 hours',
    fee: 1.5 // percent
  };
};