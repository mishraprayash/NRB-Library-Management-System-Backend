/**
 * EMAIL WORKER - UPDATED CODE
 *
 * Handles automated email notifications and event-triggered emails
 */

import prisma from '../../lib/prisma.js';
import { sendEmail } from './emailConfig.js';
import { generateEmailTemplate } from './emailTemplate.js';
import { emailQueue } from '../bullMQ/queue.js';

// Configuration constants
const REMINDER_WINDOW = 2 * 24 * 60 * 60 * 1000; // 2 days
const REMINDER_WINDOW_TESTING = 15 * 24 * 60 * 60 * 1000; // 15 days

const CRON_SCHEDULE =
  process.env.NODE_ENV === 'production'
    ? '0 0 * * *' // Daily at midnight in production
    : '*/60 * * * * *'; // Every 60 seconds in development

const EMAIL_BATCH_SIZE = 30;

/**
 * Handles scheduled book due reminders via cron job
 *
 * This function:
 * - Fetches borrowed books that are due within the reminder window.
 * - Groups the books by member to send a consolidated reminder email.
 * - Sends reminder emails to members using the `sendEmail` function.
 * - Logs success or failure for each email sent.
 *
 * The function is scheduled to run periodically using a cron job.
 */
export async function findDueBookRemindersAndSendEmail() {
  try {
    console.log('⏱️ Searching for due soon books.....');

    const now = new Date();
    const cutoffDate = new Date(now.getTime() + REMINDER_WINDOW);

    const borrowedBooks = await prisma.borrowedBook.findMany({
      where: {
        returned: false,
        reminderEmailSent: false,
        expiryDate: { gt: now, lte: cutoffDate },
      },
      select: {
        id: true,
        expiryDate: true,
        book: { select: { name: true } },
        member: { select: { username: true, email: true } },
      },
    });

    if (borrowedBooks.length === 0) {
      console.log('✅ No due soon books found');
      return;
    }

    // Group books by member
    const membersMap = new Map();

    for (const { member, book, expiryDate, id } of borrowedBooks) {
      const key = `${member.email}-${member.username}`;
      if (membersMap.has(key)) {
        membersMap.get(key).books.push({ name: book.name, expiryDate, borrowedBookId: id });
      } else {
        membersMap.set(key, {
          ...member,
          books: [{ name: book.name, expiryDate, borrowedBookId: id }],
        });
      }
    }
    // array to store username of member to whom the email were successfully sent
    const borrowedBooksWithEmailSent = [];

    await Promise.all(
      Array.from(membersMap.values()).map(async (member) => {
        try {
          const template = generateEmailTemplate(events.bookEvents['book-due-reminder'], {
            username: member.username,
            books: member.books,
          });
          // isEmailSent --> Boolean
          const isEmailSent = await sendEmail(member.email, template.subject, template.html);
          if (isEmailSent) {
            member.books.forEach((book) => {
              borrowedBooksWithEmailSent.push(book.borrowedBookId);
            });
          }
        } catch (error) {
          console.error(`❌ Failed to send to ${member.email}:`, error);
        }
      })
    );

    // updating the reminderSentEmail field to true for members to whom email was successfully sent.
    if (borrowedBooksWithEmailSent.length) {
      for (let i = 0; i < borrowedBooksWithEmailSent.length; i += EMAIL_BATCH_SIZE) {
        const batch = borrowedBooksWithEmailSent.slice(i, i + EMAIL_BATCH_SIZE);
        await prisma.borrowedBook.updateMany({
          where: {
            id: { in: batch },
          },
          data: {
            reminderEmailSent: true,
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  } catch (error) {
    console.error('🚨 Critical error in book reminders:', error);
  }
}

// Initialize scheduled tasks
export async function runBackgroundReapeatableReminderQueue() {
  await emailQueue.add(
    'reminder-email',
    {},
    {
      repeat: {
        pattern: CRON_SCHEDULE,
        tz: 'UTC',
      },

      jobId: 'daily-book-reminder', // Fixed ID to avoid duplicates
    }
  );
}

/**
 * Sends password reset notification email
 * @param {string} email - Recipient email
 * @param {string} username - User's display name
 * @param {string} resetLink - Password reset URL
 */
export async function sendPasswordResetNotification(email, username, resetPasswordToken) {
  try {
    const template = generateEmailTemplate('password-reset', {
      email, username,
      resetPasswordToken,
    });
    await sendEmail(email, template.subject, template.html);
  } catch (error) {
    console.error(`❌ Failed to send password reset to ${email}:`, error.message);
    throw error;
  }
}

/**
 * Sends welcome notification to new members
 * @param {string} email - Recipient email
 * @param {string} username - Member's username
 * @param {string} role - Member's Role
 */

export async function sendWelcomeNotification(email, username, role) {
  try {
    const template = generateEmailTemplate('user-register', {
      username,
      role,
    });
    await emailQueue.add('welcome-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
}

/**
 * Sends welcome notification to new members
 * @param {string} email - Recipient email
 * @param {string} username - Member's display name
 * @param {string} role -  Member's role
 * @param {string} verificationToken - New member's role
 */

export async function sendVerificationEmail(email, username, role, verificationToken) {
  try {
    const template = generateEmailTemplate('send-verification-email', {
      email,
      username,
      role,
      verificationToken,
    });
    await emailQueue.add('verification-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendPasswordResetLinkEmail(email, username, resetLink) {
  try {
    const template = generateEmailTemplate('send-password-reset-link', {
      username,
      resetLink,
    });
    await emailQueue.add('reset-password-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send password reset link to ${email}:`, error.message);
    throw error;
  }
}

export async function sendUserActivationEmail(email, username) {
  try {
    const template = generateEmailTemplate('user-activated', {
      username,
    });
    await emailQueue.add('user-activation-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send user activation email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendUserDeactivationEmail(email, username) {
  try {
    const template = generateEmailTemplate('user-deactivated', {
      username,
    });
    await emailQueue.add('user-deactivation-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send user deactivation email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendUserDeletionEmail(email, username) {
  try {
    const template = generateEmailTemplate('user-deleted', {
      username,
    });
    await emailQueue.add('user-deletion-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send user deletion email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendBookAssignedEmail(email, username, bookName, dueDate) {
  try {
    const template = generateEmailTemplate('book-assigned', {
      username,
      bookName,
      dueDate,
    });
    await emailQueue.add('book-assigned-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send book assignment email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendBookRenewedEmail(email, username, bookName, dueDate) {
  try {
    const template = generateEmailTemplate('user-renewed', {
      username,
      bookName,
      dueDate,
    });
    await emailQueue.add('book-renewed-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send book renewal email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendBookReturnedEmail(email, username, bookNames) {
  try {
    const template = generateEmailTemplate('book-returned', {
      username,
      bookNames,
    });
    await emailQueue.add('book-returned-email', {
      to: email,
      subject: template.subject,
      message: template.html,
    });
  } catch (error) {
    console.error(`❌ Failed to send book returned email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendUserEditEmail(email, username) {
  try {
    const template = generateEmailTemplate('notify-user-edit', {
      email,
      username
    })
    await emailQueue.add('useredit-email', {
      to: email,
      subject: template.subject,
      message: template.html
    })
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
}

export async function sendPasswordChangedEmail(email,username){
  try {
    const template = generateEmailTemplate('password-changed', {
      email,
      username
    })
    await emailQueue.add('password-changed-email', {
      to: email,
      subject: template.subject,
      message: template.html
    })
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
}
