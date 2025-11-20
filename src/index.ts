import dotenv from 'dotenv';
dotenv.config();
import { server } from './app';
import connectDB from './config/db';

const PORT = process.env.PORT || 5000;

// Connect to Database then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});