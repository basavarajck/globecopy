
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../src/models/User';
import Pool from '../src/models/Pool';
import connectDB from '../src/config/db';

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Pool.deleteMany({});

  // Create Users
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@globalremit.com',
    passwordHash: '123456',
    role: 'ADMIN',
    country: 'US'
  });

  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: '123456',
    role: 'USER',
    country: 'US'
  });

  console.log(`Created Admin: ${admin._id}`);
  console.log(`Created User: ${user._id}`);

  // Create Liquidity Pools
  await Pool.create([
    { currency: 'USD', country: 'Global', type: 'SENDER', balance: 0, reserved: 0 }, // Sender pool starts empty (grows with income)
    { currency: 'EUR', country: 'France', type: 'RECEIVER', balance: 100000, reserved: 0 }, // Receiver pool pre-funded
    { currency: 'MXN', country: 'Mexico', type: 'RECEIVER', balance: 5000000, reserved: 0 }
  ]);

  console.log('Liquidity Pools seeded');

  (process as any).exit();
};

seedData();