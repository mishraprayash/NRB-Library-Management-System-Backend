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
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";  // Add compression
import timeout from "connect-timeout";  // Add timeout handling
import { v4 as uuidv4 } from "uuid"

// Route imports
import authRoute from "./routes/authRoutes.js";
import bookRoute from "./routes/bookRoute.js";
import memberRoute from "./routes/memberRoute.js";
import commonRoute from "./routes/commonRoute.js";
import variableRoute from "./routes/variableRoutes.js";


import { errorHandler } from "./middleware/errorHandler.js";

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

  app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  })

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      // console.info({
      //   requestId: req.id,
      //   method: req.method,
      //   url: req.url,
      //   status: res.statusCode,
      //   duration: `${duration}ms`,
      //   userAgent: req.get('user-agent'),
      //   ip: req.ip
      // });
    });
    next();
  });

  // Enhanced security headers with specific configurations
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // styleSrc: ["'self'", "'unsafe-inline"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }));

  // Request timeout (10 seconds)
  app.use(timeout('10s'));
  app.use((req, res, next) => {
    if (!req.timedout) next();
  });

  // Request size limits
  app.use(express.json({ limit: '20kb' }));
  app.use(express.urlencoded({ extended: true, limit: '20kb' }));

  // Response compression
  app.use(compression({
    level: 6, // Compression level (0-9)
    threshold: '1kb', // Only compress responses larger than 1kb
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Standard middleware
  app.use(cookieParser());

  // Global rate limiter - 100 requests per 15 minutes
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 60 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });

  // Auth route specific limiter - 5 requests per minute
  const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again after a minute',
  });

  // Apply global rate limiter to all routes
  app.use(globalLimiter);

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

  // API Routes with specific rate limiters
  app.use(`${API_PREFIX_VERSION}`, authLimiter, authRoute); // Apply auth limiter to auth routes
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

  // Global Error handler
  app.use(errorHandler)

  return app;
}

/**
 * Start the server and handle graceful shutdown
 */
function startServer() {
  const app = setupExpressApp();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT} (${NODE_ENV} mode)---http://localhost:${PORT}`);
    console.log(`Worker node ${process.pid} started`);
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
  console.log(`Starting ${WORKER_COUNT} node worker(s)...`);

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
