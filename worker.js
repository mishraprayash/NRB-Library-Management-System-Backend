'use strict';

/**
 * Library Management System - Worker Service
 *
 * Handles background jobs and email processing
 */
import express from 'express';
import winston from 'winston';

import { startEmailWorker } from './services/bullMQ/worker.js';
import { config } from 'dotenv';
import { runBackgroundReapeatableReminderQueue } from './services/emailService/emailSender.js';

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = ['LIBRARY_EMAIL_AUTH_USER', 'LIBRARY_EMAIL_AUTH_PASSWORD'];

// Constants
const PORT = process.env.WORKER_PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure Winston logger
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/worker-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/worker-combined.log',
    }),
  ],
});

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Initialize Express app for health checks
const app = express();

// Health check endpoint
app.get('/worker/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'worker',
    environment: NODE_ENV,
    timestamp: new Date(),
  });
});

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Worker service started on port ${PORT} (${NODE_ENV} mode)`);
});

// Handle graceful shutdown
const shutdownGracefully = () => {
  logger.info('Worker service shutting down...');
  server.close(() => {
    logger.info('Worker service closed connections and exiting');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

// Start workers
try {
  logger.info('Starting email workers...');
  if (!process.env.LIBRARY_EMAIL_AUTH_USER || !process.env.LIBRARY_EMAIL_AUTH_PASSWORD) {
    throw new Error('Email credentials not found in environment variables');
  }
  startEmailWorker();
  runBackgroundReapeatableReminderQueue();
  logger.info('All workers started successfully');
} catch (error) {
  logger.error('Error starting workers:', error);
  process.exit(1);
}
