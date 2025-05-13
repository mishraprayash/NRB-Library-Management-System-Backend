import nodemailer from 'nodemailer';
import { config } from 'dotenv';

// Load environment variables
config();

const validateEmailConfig = () => {
  if (!process.env.EMAIL_AUTH_USER || !process.env.EMAIL_AUTH_PASSWORD) {
    throw new Error(
      'Email authentication credentials missing. Please set EMAIL_AUTH_USER and EMAIL_AUTH_PASSWORD environment variables'
    );
  }
};

// Validate email configuration
validateEmailConfig();

export const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_AUTH_USER,
    pass: process.env.EMAIL_AUTH_PASSWORD,
  }
});

/**
 * Sends an email to the specified recipient
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - HTML message body
 * @returns {Promise<boolean>} Success status of the email operation
 */
export const sendEmail = async (to, subject, message) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_AUTH_USER,
      to,
      subject,
      html: message,
    });

    if (info.accepted.includes(to)) {
      console.log(`✅ Email successfully sent to ${to}`);
      return true;
    }
    console.log(`❌ Email to ${to} was not accepted by mail server`);
    return false;
  } catch (error) {
    console.error(`Error while sending an email to ${to}:`, error);
    return false;
  }
};
