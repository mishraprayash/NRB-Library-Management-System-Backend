"use strict";

import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cluster from "cluster";
import os from "os";

import adminRoute from "./routes/adminRoute.js";
import commonRoute from "./routes/commonRoute.js";
import memberRoute from "./routes/memberRoute.js"
import superAdminRoute from "./routes/superAdmin.js"

import { logger } from "./services/logging.js";

// Load environment variables
config();


// Constants
const PORT = process.env.PORT || 5000;
const API_PREFIX_VERSION = "/api/v1";



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
app.use(`${API_PREFIX_VERSION}/member`, memberRoute)
app.use(`${API_PREFIX_VERSION}/superadmin`,superAdminRoute);


// Default route
app.get("/", (req, res) => {
  res.json({ message: "Server is up", status: "OK!" , timestamp:new Date()});
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
  const WORKER_COUNT = Math.max(numCPUs / 2, 1); // Leave one core free

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
