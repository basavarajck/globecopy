
import mongoose from 'mongoose';
import logger from './logger';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/globalremit');
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
    (process as any).exit(1);
  }
};

export default connectDB;