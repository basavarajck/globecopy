import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Custom Error Class for Operational Errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized Error Handler
export const errorHandler = (err: any, req: any, res: any, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${message} - Stack: ${err.stack}`);
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${message}`);
  }

  // Clean JSON response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};