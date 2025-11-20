
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
  headers: any;
  body: any;
  params: any;
}

export const protect = (req: AuthRequest, res: any, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const adminOnly = (req: AuthRequest, res: any, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

export const receiverOnly = (req: AuthRequest, res: any, next: NextFunction) => {
  if (req.user && req.user.role === 'RECEIVER') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as receiver' });
  }
};