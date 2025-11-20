
import express, { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// Register Sender
export const registerSender = async (req: any, res: any) => {
  try {
    const { name, email, password, country } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User exists' });

    const user = await User.create({
      name, email, passwordHash: password, country, role: 'USER'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString(), user.role)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Login Sender
export const loginSender = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'USER' });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        token: generateToken(user._id.toString(), user.role)
      });
    } else {
      res.status(401).json({ message: 'Invalid sender credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Login Receiver
export const loginReceiver = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'RECEIVER' });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        token: generateToken(user._id.toString(), user.role)
      });
    } else {
      res.status(401).json({ message: 'Invalid receiver credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Login Admin
export const loginAdmin = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'ADMIN' });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        token: generateToken(user._id.toString(), user.role)
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};