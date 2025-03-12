"use strict";

import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cluster from "node:cluster";
import os from "node:os";


import commonRoute from "./routes/commonRoute.js";
import memberRoute from "./routes/memberRoute.js"

import authRoute from "./routes/authRoutes.js"
import bookRoute from "./routes/bookRoute.js"
import variableRoute from "./routes/variableRoutes.js"


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
app.use(`${API_PREFIX_VERSION}`, authRoute);
app.use(`${API_PREFIX_VERSION}/book`, bookRoute)
app.use(`${API_PREFIX_VERSION}/member`, memberRoute)
app.use(`${API_PREFIX_VERSION}/common`, commonRoute);
app.use(`${API_PREFIX_VERSION}/variables`, variableRoute)



// Default route
app.get("/", (req, res) => {
  res.json({ message: "Server is up", status: "OK!", timestamp: new Date() });
});


// Centralized error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Function to start the server
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log('Server Started Successfully');
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    server.close(() => {
      process.exit(0);
    });
  });
};

// Clustering logic
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  const WORKER_COUNT = Math.max(numCPUs / 2, 1); // Leave one core free

  for (let i = 0; i < WORKER_COUNT; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  startServer();
}
