// import { Queue } from 'bullmq';

// export const welcomeQueue = new Queue('email-queue', {
//   connection: {
//     host: process.env.REDIS_HOST || localhost,
//     port: parseInt(process.env.REDIS_PORT || '6379'),
//     // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
//     maxRetriesPerRequest: 10,
//     enableReadyCheck: true,
//     connectTimeout: 10000, // 10 seconds
//     disconnectTimeout: 5000, // 5 seconds
//     keepAlive: 30000, // 30 seconds
//     retryStrategy: (times) => {
//       // Exponential backoff with a cap
//       const delay = Math.min(Math.pow(2, times) * 1000, 30000);
//       console.log(`Redis connection retry attempt ${times} in ${delay}ms`);
//       return delay;
//     },
//   },
//   defaultJobOptions: {
//     attempts: 5,
//     backoff: {
//       type: 'exponential',
//       delay: 5000, // 5 seconds
//     },
//     removeOnComplete: {
//       age: 3600,
//       count: 300,
//     },
//     removeOnFail: false,
//   },
// });

// // Add queue event listeners for better monitoring
// welcomeQueue.on('error', (error) => {
//   console.error('Email queue error:', error);
// });

// welcomeQueue.on('failed', (job, error) => {
//   console.error(`Job ${job.id} failed:`, error);
// });

// export const reminderQueue = new Queue('reminder-queue', {
//   connection: {
//     host: process.env.REDIS_HOST || 'localhost',
//     port: parseInt(process.env.REDIS_PORT || '6379'),
//     // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
//     maxRetriesPerRequest: 10,
//     enableReadyCheck: true,
//     connectTimeout: 10000,
//   },
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: {
//       type: 'exponential',
//       delay: 10000, // 10 seconds
//     },
//     removeOnComplete: {
//       age: 24 * 3600, // Keep for 24 hours
//       count: 100,
//     },
//     removeOnFail: false,
//   },
// });

// // Add queue event listeners
// reminderQueue.on('error', (error) => {
//   console.error('Reminder queue error:', error);
// });

// export const verificationEmailQueue = new Queue('verification-email-queue', {
//   connection: {
//     host: process.env.REDIS_HOST || 'localhost',
//     port: parseInt(process.env.REDIS_PORT || '6379'),
//     // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
//     maxRetriesPerRequest: 10,
//     enableReadyCheck: true,
//     connectTimeout: 10000,
//   },
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: {
//       type: 'exponential',
//       delay: 10000, // 10 seconds
//     },
//     removeOnComplete: {
//       age: 24 * 3600, // Keep for 24 hours
//       count: 100,
//     },
//     removeOnFail: false,
//   },
// });

// export const resetPasswordEmailQueue = new Queue('reset-password-email-queue', {
//   connection: {
//     host: process.env.REDIS_HOST || 'localhost',
//     port: parseInt(process.env.REDIS_PORT || '6379'),
//     // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
//     maxRetriesPerRequest: 10,
//     enableReadyCheck: true,
//     connectTimeout: 10000,
//   },
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: {
//       type: 'exponential',
//       delay: 10000, // 10 seconds
//     },
//     removeOnComplete: {
//       age: 24 * 3600, // Keep for 24 hours
//       count: 100,
//     },
//     removeOnFail: false,
//   },
// });

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('Closing email queue connection...');
//   console.log('Closing reminder queue connection...');
//   await welcomeQueue.close();
//   await reminderQueue.close();
//   console.log('Welcome Email queue connection closed');
//   console.log('Reminder Email queue connection closed');
// });


import { Queue } from 'bullmq';

export const emailQueue = new Queue('email-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: 10,
    enableReadyCheck: true,
    connectTimeout: 10000,
    disconnectTimeout: 5000,
    keepAlive: 30000,
    retryStrategy: (times) => Math.min(Math.pow(2, times) * 1000, 30000),
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600,
      count: 300,
    },
    removeOnFail: false,
  },
});


// Listen to events
emailQueue.on('error', (error) => {
  console.error('Email queue error:', error);
});

emailQueue.on('failed', (job, error) => {
  console.error(`Job ${job.name} (${job.id}) failed:`, error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing email queue connection...');
  await emailQueue.close();
  console.log('Email queue connection closed');
});
