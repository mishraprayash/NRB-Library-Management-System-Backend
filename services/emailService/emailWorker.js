/**
 * EMAIL WORKER - UPDATED CODE
 * 
 * Handles automated email notifications and event-triggered emails
 */

import prisma from "../../lib/prisma.js";
import { sendEmail } from "./emailConfig.js";
import { generateEmailTemplate } from "./emailTemplate.js";
import { reminderQueue, verificationEmailQueue, welcomeQueue } from "../bullMQ/Queue.js";

// Configuration constants
const REMINDER_WINDOW = 2 * 24 * 60 * 60 * 1000; // 2 days 
const REMINDER_WINDOW_TESTING = 15 * 24 * 60 * 60 * 1000; // 15 days 

const CRON_SCHEDULE = process.env.NODE_ENV === "production"
  ? "0 0 * * *"  // Daily at midnight in production
  : "*/60 * * * * *"; // Every 60 seconds in development

const EMAIL_BATCH_SIZE = 30;

// will be used later
export const events = {
  bookEvents: {
    'book-due-reminder': 'book-due-reminder',
    'add-book': 'add-book',
    'edit-book': 'edit-book',
    'add-book-stock': 'add-book-stock',
    'delete-book': 'delete-book',
    'borrow-book': 'borrow-book',
    'return-book': 'return-book',
    'renew-book': 'renew-book'
  },
  userEvents: {
    'user-register': 'user-register',
    'user-delete': 'user-delete',
    'user-edit': 'user-edit',
    'password-reset': 'password-reset',
    'send-verification-email': 'send-verification-email'
  },
}

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
export async function handleScheduledBookReminders() {
  try {
    console.log("⏱️ Searching for due soon books.....");

    const now = new Date();
    const cutoffDate = new Date(now.getTime() + REMINDER_WINDOW);

    const borrowedBooks = await prisma.borrowedBook.findMany({
      where: {
        returned: false,
        reminderEmailSent: false,
        expiryDate: { gt: now, lte: cutoffDate }
      },
      select: {
        id: true,
        expiryDate: true,
        book: { select: { name: true } },
        member: { select: { username: true, email: true } }
      }
    });

    if (borrowedBooks.length === 0) {
      console.log("✅ No due soon books found");
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
          books: [{ name: book.name, expiryDate, borrowedBookId: id }]
        });
      }
    }

    // array to store username of member to whom the email were successfully sent
    let borrowedBooksWithEmailSent = [];

    await Promise.all(Array.from(membersMap.values()).map(async (member) => {
      try {
        const template = generateEmailTemplate(events.bookEvents["book-due-reminder"], {
          username: member.username,
          books: member.books
        });
        // isEmailSent --> Boolean
        const isEmailSent = await sendEmail(
          member.email,
          template.subject,
          template.html
        );
        if (isEmailSent) {
          member.books.forEach(book => {
            borrowedBooksWithEmailSent.push(book.borrowedBookId);
          });
        }
      } catch (error) {
        console.error(`❌ Failed to send to ${member.email}:`, error);
      }
    }));

    // updating the reminderSentEmail field to true for members to whom email was successfully sent.
    if (borrowedBooksWithEmailSent.length) {
      for (let i = 0; i < borrowedBooksWithEmailSent.length; i += EMAIL_BATCH_SIZE) {
        const batch = borrowedBooksWithEmailSent.slice(i, i + EMAIL_BATCH_SIZE);
        await prisma.borrowedBook.updateMany({
          where: {
            id: { in: batch }
          },
          data: {
            reminderEmailSent: true
          }
        })
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (error) {
    console.error("🚨 Critical error in book reminders:", error);
  }
}

/**
 * Sends password reset notification email
 * @param {string} email - Recipient email
 * @param {string} username - User's display name
 * @param {string} resetLink - Password reset URL
 */
export async function sendPasswordResetNotification(email, username, resetLink) {
  try {
    const template = generateEmailTemplate(events.userEvents['password-reset'], { username, resetLink });
    await sendEmail(email, template.subject, template.html_ne);
    console.log(`✅ Password reset sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset to ${email}:`, error.message);
    throw error;
  }
}

/**
 * Sends welcome notification to new members
 * @param {string} email - Recipient email 
 * @param {string} username - New member's display name
 */

export async function sendWelcomeNotification(email, username, password, role) {
  try {
    const template = generateEmailTemplate(events.userEvents['user-register'], { username, password, role })
    await welcomeQueue.add('welcome-email', { to: email, subject: template.subject, message: template.html })
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
}


export async function sendVerificationEmail(email, username, role, verificationToken) {
  try {
    const template = generateEmailTemplate(events.userEvents['send-verification-email'], { email, username, role, verificationToken })
    await verificationEmailQueue.add('verification-email-queue', { to: email, subject: template.subject, message: template.html })
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
}


// Initialize scheduled tasks
export async function runBackgroundReapeatableReminderQueue() {

  await reminderQueue.add(
    'daily-reminder-check',
    {},
    {
      repeat: {
        pattern: CRON_SCHEDULE,
        tz: 'UTC' // Or your local timezone
      },

      jobId: 'daily-book-reminder' // Fixed ID to avoid duplicates
    }
  );

}