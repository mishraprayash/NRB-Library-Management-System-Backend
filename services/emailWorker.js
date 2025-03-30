/**
 * EMAIL WORKER - UPDATED CODE
 * 
 * Handles automated email notifications and event-triggered emails
 */

import prisma from "../lib/prisma.js";
import { sendEmail } from "./emailConfig.js";
import { generateEmailTemplate } from "./emailTemplate.js";
import cron from "node-cron";

// Configuration constants
const REMINDER_WINDOW = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
const CRON_SCHEDULE = "* */10 * * * *"; // Every 10 minutes (for testing)

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
    console.log("⏱️ Starting scheduled book reminders");
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + REMINDER_WINDOW);

    const borrowedBooks = await prisma.borrowedBook.findMany({
      where: {
        returned: false,
        expiryDate: { gt: now, lte: cutoffDate }
      },
      select: {
        expiryDate: true,
        book: { select: { name: true } },
        member: { select: { username: true, email: true } }
      }
    });

    if (borrowedBooks.length === 0) {
      console.log("✅ No due books found");
      return;
    }

    // Group books by member
    const membersMap = borrowedBooks.reduce((map, { member, book, expiryDate }) => {
      const key = `${member.email}-${member.username}`;
      map.get(key)?.books.push({ name: book.name, expiryDate }) || 
        map.set(key, { ...member, books: [{ name: book.name, expiryDate }] });
      return map;
    }, new Map());

    await Promise.all(Array.from(membersMap.values()).map(async (member) => {
      try {
        const template = generateEmailTemplate('book-due-reminder', {
          username: member.username,
          books: member.books
        });
        
        await sendEmail({
          to: member.email,
          ...template
        });
        console.log(`✅ Reminder sent to ${member.email}`);
      } catch (error) {
        console.error(`❌ Failed to send to ${member.email}:`, error.message);
      }
    }));

  } catch (error) {
    console.error("🚨 Critical error in book reminders:", error);
  } finally {
    console.log("⏱️ Book reminder process completed");
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
    const template = generateEmailTemplate('password-reset', { username, resetLink });
    await sendEmail({ to: email, ...template });
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
export async function sendWelcomeNotification(email, username) {
  try {
    const template = generateEmailTemplate('user-registration', { username });
    await sendEmail({ to: email, ...template });
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
}

// Initialize scheduled tasks
cron.schedule(CRON_SCHEDULE, handleScheduledBookReminders);
console.log(`⏰ Scheduled tasks initialized (${CRON_SCHEDULE})`);