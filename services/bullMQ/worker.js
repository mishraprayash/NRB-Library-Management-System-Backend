import { Worker } from "bullmq";
import { sendEmail } from "../emailService/emailConfig.js";
import { handleScheduledBookReminders } from "../emailService/emailSenders.js";



async function welcomeEmailWorker() {
    const emailWorker = new Worker('email-queue',
        async (job) => {
            console.log(`Processing welcome email job id: ${job.id}`);
            const { to, subject, message } = job.data;

            try {
                // Add timeout for email sending
                const emailPromise = sendEmail(to, subject, message);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email sending timeout')), 20000));

                await Promise.race([emailPromise, timeoutPromise]);
                return { success: true, timestamp: new Date().toISOString() };
            } catch (error) {
                console.error(`Error sending email for job ${job.id}:`, error);
                throw new Error(`Email sending failed: ${error.message}`);
            }
        },
        {
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
                enableReadyCheck: true,
                connectTimeout: 10000, // 10 seconds
                retryStrategy: (times) => {
                    // Exponential backoff with a cap
                    const delay = Math.min(Math.pow(2, times) * 1000, 30000);
                    console.log(`Redis connection retry attempt ${times} in ${delay}ms`);
                    return delay;
                }
            },
            concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5'),
            limiter: {
                max: 50, // Maximum number of jobs processed
                duration: 60000 // Per minute
            },
            stalledInterval: 30000, // Check for stalled jobs every 30 seconds
            lockDuration: 60000, // 60 seconds lock
        }
    );

    // Event handlers with better logging
    emailWorker.on('completed', (job, result) => {
        console.log(`✅ Email job ${job.id} completed successfully:`, result);
    });

    emailWorker.on('failed', (job, error) => {
        console.error(`❌ Email job ${job.id} failed:`, error);
        // Could add notification for critical failures here
    });

    emailWorker.on('error', (error) => {
        console.error('⚠️ Worker error:', error);
    });

    emailWorker.on('stalled', (jobId) => {
        console.warn(`⚠️ Job ${jobId} stalled and will be reprocessed`);
    });

    // Handle various termination signals for graceful shutdown
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

    console.log('Welcome Email Wokerr started successfully');
    return emailWorker;
}

async function reminderEmailWorker() {
    const reminderWorker = new Worker('reminder-queue',
        async (job) => {
            console.log(`Processing reminder job: ${job.id}`);

            try {
                // Execute the existing function as-is
                await handleScheduledBookReminders();
                return { success: true, timestamp: new Date().toISOString() };
            } catch (error) {
                console.error(`Error processing reminders:`, error);
                throw new Error(`Reminder processing failed: ${error.message}`);
            }
        },
        {
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
                enableReadyCheck: true,
                connectTimeout: 10000
            },
            concurrency: 1 // Only run one reminder job at a time
        }
    );

    // Event handlers
    reminderWorker.on('completed', (job, result) => {
        console.log(`✅ Reminder job ${job.id} completed:`, result);
    });

    reminderWorker.on('failed', (job, error) => {
        console.error(`❌ Reminder job ${job.id} failed:`, error);
    });

    reminderWorker.on('error', (error) => {
        console.error('⚠️ Reminder worker error:', error);
    });

    // Graceful shutdown
    const shutdownGracefully = async (signal) => {
        console.log(`Received ${signal}. Closing reminder worker...`);
        try {
            await reminderWorker.close();
            console.log('Reminder worker closed successfully');
        } catch (err) {
            console.error('Error closing reminder worker:', err);
        }
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    process.on('SIGINT', () => shutdownGracefully('SIGINT'));

    console.log('Reminder queue worker started successfully');
    return reminderWorker;
}

async function verificationEmailWorker() {
    const verificationEmailWorker = new Worker('verification-email-queue',
        async (job) => {
            console.log(`Processing verification email job: ${job.id}`);

            const {to, subject, message} = job.data;

            try {
                await sendEmail(to, subject, message);
                return { success: true, timestamp: new Date().toISOString() };
            } catch (error) {
                console.error(`Error processing reminders:`, error);
                throw new Error(`Reminder processing failed: ${error.message}`);
            }
        },
        {
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
                enableReadyCheck: true,
                connectTimeout: 10000
            },
            concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5'),
        }
    );

        // Event handlers with better logging
        verificationEmailWorker.on('completed', (job, result) => {
            console.log(`✅ Verification Email job ${job.id} completed successfully:`, result);
        });
    
        verificationEmailWorker.on('failed', (job, error) => {
            console.error(`❌ Email job ${job.id} failed:`, error);
            // Could add notification for critical failures here
        });
    
        verificationEmailWorker.on('error', (error) => {
            console.error('⚠️ Worker error:', error);
        });
    
        verificationEmailWorker.on('stalled', (jobId) => {
            console.warn(`⚠️ Job ${jobId} stalled and will be reprocessed`);
        });
    
        // Handle various termination signals for graceful shutdown
        const shutdownGracefully = async (signal) => {
            console.log(`Received ${signal}. Closing verification email worker...`);
            try {
                await verificationEmailWorker.close();
                console.log('Verification Email worker closed successfully');
            } catch (err) {
                console.error('Error closing verification email worker:', err);
            }
            process.exit(0);
        };
    
        process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
        process.on('SIGINT', () => shutdownGracefully('SIGINT'));
        process.on('SIGHUP', () => shutdownGracefully('SIGHUP'));
    
        console.log('Verification Email Wokerr started successfully');
        return verificationEmailWorker;
}


// export const resetPasswordLinkWorker(){

// }

export function runEmailWorkers() {

    // worker for sending welcome notification if any new user or admin is added to the system
    welcomeEmailWorker();

    // worker that sends a reminder email for returning books before deadline to the members  
    reminderEmailWorker();

    // 
    verificationEmailWorker();
}