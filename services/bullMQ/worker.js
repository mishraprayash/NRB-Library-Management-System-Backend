import { Worker } from 'bullmq';
import { sendEmail } from '../emailService/emailConfig.js';
import { findDueBookRemindersAndSendEmail } from '../emailService/emailSender.js';

export async function startEmailWorker() {
  const emailWorker = new Worker(
    'email-queue',
    async (job) => {
      console.log(`Processing job ${job.name} with id ${job.id}`);

      try {
        switch (job.name) {
          case 'welcome-email':
          case 'verification-email':
          case 'useredit-email':
          case 'password-changed-email':
          case 'reset-password-email':
          case 'user-activation-email':
          case 'user-deactivation-email':
          case 'user-deletion-email':
          case 'book-assigned-email':
          case 'book-renewed-email':
          case 'book-returned-email': {
            const { to, subject, message } = job.data;

            // Add timeout protection
            const emailPromise = sendEmail(to, subject, message);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Email sending timeout')), 20000)
            );

            await Promise.race([emailPromise, timeoutPromise]);
            return { success: true, type: job.name, timestamp: new Date().toISOString() };
          }

          case 'reminder-email': {
            // Handle scheduled reminders
            await findDueBookRemindersAndSendEmail();
            return { success: true, type: 'reminder', timestamp: new Date().toISOString() };
          }

          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing job ${job.name} (id ${job.id}):`, error);
        throw new Error(`Processing failed: ${error.message}`);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        enableReadyCheck: true,
        connectTimeout: 10000,
        retryStrategy: (times) => Math.min(Math.pow(2, times) * 1000, 30000),
      },
      concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5'),
      limiter: {
        max: 50,  // Maximum 50 jobs per minute
        duration: 60000,
      },
      stalledInterval: 30000, // Detect stalled jobs every 30 seconds
      lockDuration: 60000,     // Job lock duration
    }
  );

  // Event Handlers
  emailWorker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.name} (${job.id}) completed successfully:`, result);
  });

  emailWorker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.name} (${job?.id}) failed:`, error);
  });

  emailWorker.on('error', (error) => {
    console.error('⚠️ Worker error:', error);
  });

  emailWorker.on('stalled', (jobId) => {
    console.warn(`⚠️ Job ${jobId} stalled and will be reprocessed`);
  });

  // Graceful Shutdown
  const shutdownGracefully = async (signal) => {
    console.log(`Received ${signal}. Closing email worker...`);
    try {
      await emailWorker.close();
      console.log('Email worker closed successfully');
    } catch (err) {
      console.error('Error closing email worker:', err);
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
  process.on('SIGINT', () => shutdownGracefully('SIGINT'));
  process.on('SIGHUP', () => shutdownGracefully('SIGHUP'));

  console.log('📨 Email Worker started successfully!');
  return emailWorker;
}
