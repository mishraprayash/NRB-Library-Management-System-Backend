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
          case 'role-changed-email':
          case 'book-returned-email': {
            const { to, subject, message } = job.data;

            const emailResult = await sendEmail(to, subject, message);
            
            if (!emailResult) {
              throw new Error(`Failed to send ${job.name} to ${to}`);
            }
            
            return {
              success: true,
              type: job.name,
              timestamp: new Date().toISOString()
            };
          }

          case 'reminder-email': {
            // Handle scheduled reminders
            const reminderResult = await findDueBookRemindersAndSendEmail();

            if (!reminderResult || !reminderResult.success) {
              throw new Error(reminderResult?.error || `Failed to process reminder emails`);
            }

            if(!reminderResult.emailSent && !reminderResult.totalBooks){
              return {
                success:true,
                type:job.name,
                message:'No Books For Reminding Currently'
              }
            }
            
            return {
              success: true,
              type: job.name,
              emailSent: reminderResult.emailSent,
              totalBooks: reminderResult.totalBooks,
              timestamp: new Date().toISOString()
            };
          }

          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing job ${job.name} (id ${job.id}):`, error);
        throw error; // Re-throw the error to trigger BullMQ retry mechanism
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        enableReadyCheck: true,
        connectTimeout: 10000,
        // connection retry to redis server
        retryStrategy: (times) => Math.min(Math.pow(2, times) * 1000, 30000),
      },
      concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '10'),
      limiter: {
        max: 120,  // Maximum 100 jobs per minute
        duration: 60000,
      },
      stalledInterval: 30000, // Detect stalled jobs every 30 seconds
      lockDuration: 40000,     // Job lock duration
      timeout: 20000,
      // Add retry configuration for failed jobs
      defaultJobOptions: {
        attempts: 3,           // Number of retry attempts
        backoff: {
          type: 'exponential', // Retry strategy
          delay: 5000          // Initial delay in ms (5 seconds)
        }
      }
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
