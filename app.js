"use strict";

/**
 * Library Management System - Main Application
 * 
 * The entry point for the Library Management System API service.
 * Handles server configuration, clustering, and API routes.
 */

// Core dependencies
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cluster from "node:cluster";
import os from "node:os";
import helmet from "helmet";  // Add this dependency for security headers

// Route imports
import authRoute from "./routes/authRoutes.js";
import bookRoute from "./routes/bookRoute.js";
import memberRoute from "./routes/memberRoute.js";
import commonRoute from "./routes/commonRoute.js";
import variableRoute from "./routes/variableRoutes.js";

// Service imports
// import "./services/emailWorker.js";  // Ensure email service initializes

// Load environment variables
config();

// Constants
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_PREFIX_VERSION = "/api/v1";
const WORKER_COUNT = NODE_ENV === "production" 
  ? Math.max(Math.floor(os.cpus().length / 2), 1) // Half of available CPUs in production
  : 1; // Single worker in development

/**
 * Configure and start Express application
 * @returns {Object} Express app instance
 */
function setupExpressApp() {
  const app = express();

  // Security headers
  app.use(helmet());
  
  // Standard middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  
  // CORS configuration
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );

  // Request logging in development mode
  if (NODE_ENV === "development") {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
      next();
    });
  }

  // API Routes
  app.use(`${API_PREFIX_VERSION}`, authRoute);
  app.use(`${API_PREFIX_VERSION}/book`, bookRoute);
  app.use(`${API_PREFIX_VERSION}/member`, memberRoute);
  app.use(`${API_PREFIX_VERSION}/common`, commonRoute);
  app.use(`${API_PREFIX_VERSION}/variables`, variableRoute);

  // Health check endpoint
  app.get("/", (req, res) => {
    res.json({ 
      message: "Server is up",
      status: "healthy", 
      version: process.env.npm_package_version || "1.0.0",
      environment: NODE_ENV,
      timestamp: new Date() 
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // Centralized error handling
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(`[ERROR] ${err.message}`, err.stack);
    
    res.status(statusCode).json({ 
      message: statusCode === 500 ? "Internal server error" : err.message,
      error: NODE_ENV === "development" ? err.stack : undefined
    });
  });

  return app;
}

/**
 * Start the server and handle graceful shutdown
 */
function startServer() {
  const app = setupExpressApp();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT} (${NODE_ENV} mode)`);
    console.log(`Worker ${process.pid} started`);
  });

  // Handle graceful shutdown
  const shutdownGracefully = () => {
    console.log(`Worker ${process.pid} shutting down...`);
    server.close(() => {
      console.log(`Worker ${process.pid} closed connections and exiting`);
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error(`Worker ${process.pid} could not close connections, forcefully shutting down`);
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdownGracefully);
  process.on("SIGINT", shutdownGracefully);

  return server;
}

/**
 * Main application entry point with clustering support
 */
if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Starting ${WORKER_COUNT} workers...`);

  // Fork workers
  for (let i = 0; i < WORKER_COUNT; i++) {
    cluster.fork();
  }

  // Handle worker crashes and respawn
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}

// Make app available for testing
export default setupExpressApp;
