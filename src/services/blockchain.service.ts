
import { ethers } from 'ethers';
import logger from '../config/logger';

// Mock ABI for a settlement contract
const ABI = [
  "function recordSettlement(uint256 totalAmount, uint256 fxRate, uint256 timestamp) public returns (bytes32)"
];

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

export const connect = () => {
  try {
    if (!process.env.BLOCKCHAIN_RPC_URL || !process.env.ADMIN_WALLET_PRIVATE_KEY) {
      logger.warn('Blockchain credentials missing in .env');
      return false;
    }

    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    wallet = new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY, provider);
    contract = new ethers.Contract(process.env.SETTLEMENT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000', ABI, wallet);
    
    return true;
  } catch (error: any) {
    logger.error(`Blockchain connection failed: ${error.message}`);
    return false;
  }
};

interface SettlementParams {
  totalAmount: number;
  fxRate: number;
  timestamp: number;
}

export const recordSettlement = async ({ totalAmount, fxRate, timestamp }: SettlementParams): Promise<string> => {
  try {
    // Ensure connection
    if (!contract) {
        const connected = connect();
        if (!connected || !contract) {
             logger.warn('Blockchain not connected. Returning mock hash.');
             return '0x_MOCK_TX_HASH_' + Date.now();
        }
    }

    // Convert to BigInt/Wei format
    const amountBn = ethers.parseUnits(totalAmount.toFixed(6), 6); 
    const fxBn = ethers.parseUnits(fxRate.toFixed(4), 4);
    const timeBn = BigInt(timestamp);

    logger.info(`Sending TX to Blockchain: Amount=${totalAmount}, FX=${fxRate}`);

    // READ ENV HERE at runtime
    if (process.env.SETTLEMENT_CONTRACT_ADDRESS && process.env.SETTLEMENT_CONTRACT_ADDRESS !== '0x_REAL_ADDRESS_OR_LEAVE_DUMMY') {
        const tx = await contract.recordSettlement(amountBn, fxBn, timeBn);
        logger.info(`Blockchain TX sent: ${tx.hash}`);
        return tx.hash;
    } else {
        // Mock success for demo
        return '0x_MOCK_POLYGON_HASH_' + Math.floor(Math.random() * 1000000);
    }

  } catch (error: any) {
    logger.error(`Blockchain Write Error: ${error.message}`);
    throw new Error('Blockchain settlement failed');
  }
};