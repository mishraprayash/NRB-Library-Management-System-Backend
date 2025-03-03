"use strict";

import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cluster from "cluster";
import os from "os";
import winston from "winston";

import adminRoute from "./routes/adminRoute.js";
import commonRoute from "./routes/commonRoute.js";

// Load environment variables
config();


// Constants
const PORT = process.env.PORT || 5000;
const API_PREFIX_VERSION = "/api/v1";

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Routes
app.use(`${API_PREFIX_VERSION}/admin`, adminRoute);
app.use(`${API_PREFIX_VERSION}/common`, commonRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Server is up", status: "OK!" });
});

// Centralized error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Function to start the server
const startServer = () => {
  const server = app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} is running on PORT ${PORT}`);
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  });
};

// Clustering logic
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  const WORKER_COUNT = Math.max(numCPUs/2, 1); // Leave one core free

  logger.info(`Master process ${process.pid} is running in ${process.env.NODE_ENV || "development"} mode`);

  for (let i = 0; i < WORKER_COUNT; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    logger.info("Starting a new worker...");
    cluster.fork();
  });
} else {
  startServer();
}
