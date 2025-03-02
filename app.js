// import express from "express";
// import cors from "cors";
// import { config } from "dotenv"
// import cookieParser from "cookie-parser"


// import adminRoute from "./routes/adminRoute.js"
// import commonRoute from "./routes/commonRoute.js"

// config();
// const app = express();
// const PORT = process.env.PORT || 5000

// // middlewares
// app.use(express.json())
// app.use(cookieParser())
// app.use(cors({
//     origin:true,
//     credentials: true
// }))


// app.use('/api/v1/admin', adminRoute);
// app.use('/api/v1/common', commonRoute);

// app.get('/', (req, res) => {
//     res.json({ message: "Server is up", status:"OK!" })
// })


// const startServer = () => {
//     try {
//         app.listen(PORT, () => {
//             console.log(`Server is running on PORT ${PORT}`)
//         })
//     } catch (error) {
//         console.log(`Error occured while starting server: ${error}`)
//     }
// }

// startServer();


/* 

With Clustering 

*/


// import express from "express";
// import cors from "cors";
// import { config } from "dotenv";
// import cookieParser from "cookie-parser";
// import cluster from "cluster";
// import os from "os";

// import adminRoute from "./routes/adminRoute.js";
// import commonRoute from "./routes/commonRoute.js";

// config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middlewares
// app.use(express.json());
// app.use(cookieParser());
// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   })
// );

// // Routes
// app.use("/api/v1/admin", adminRoute);
// app.use("/api/v1/common", commonRoute);

// app.get("/", (req, res) => {
//   res.json({ message: "Server is up", status: "OK!" });
// });

// // Function to start the server
// const startServer = () => {
//   try {
//     app.listen(PORT, () => {
//       console.log(`Worker ${process.pid} is running on PORT ${PORT}`);
//     });
//   } catch (error) {
//     console.log(`Error occurred while starting server: ${error}`);
//   }
// };

// // Clustering logic
// if (cluster.isPrimary) {
//   // Get the number of CPU cores
//   const numCPUs = os.cpus().length;

//   console.log(`Master process ${process.pid} is running`);

//   // Fork workers for each CPU core
//   for (let i = 0; i < numCPUs/2; i++) {
//     cluster.fork();
//   }

//   // Handle worker exit
//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
//     console.log("Starting a new worker...");
//     cluster.fork(); // Restart the worker if it dies
//   });
// } else {
//   // If it's a worker, start the server
//   startServer();
// }


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
  const WORKER_COUNT = Math.max(numCPUs - 1, 1); // Leave one core free

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