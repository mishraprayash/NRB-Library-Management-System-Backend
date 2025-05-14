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
