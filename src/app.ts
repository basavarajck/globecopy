import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api';
import { errorHandler, AppError } from './middleware/error';
import logger from './config/logger';

const app = express();
const server = http.createServer(app);

// Setup WebSockets
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('join_room', (userId) => {
    socket.join(userId);
    logger.debug(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    logger.debug('Client disconnected');
  });
});

// Security Middleware
app.use(helmet()); // Set security HTTP headers

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body Parsing & Logging
app.use(express.json({ limit: '10kb' }) as any); // Limit body size
app.use(morgan('combined', { stream: { write: message => logger.http(message.trim()) } }) as any);

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Routes
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'up', message: 'GlobalRemit API Running' });
});

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Centralized Error Handler
app.use(errorHandler);

export { server };