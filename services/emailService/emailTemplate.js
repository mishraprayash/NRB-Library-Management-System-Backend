/**
 * Email Template Manager
 *
 * Handles generation of HTML and plain text email templates with multilingual support.
 * Supports multiple notification types including book reminders, password resets, and welcome emails.
 */

import { baseStyles } from './template-style.js';
import { sanitizeInput, formatLocalizedDate, convertToNepaliTime } from './utilities.js';
import { calculateExpiryDate } from '../../lib/helpers.js';

/**
 * Generates email templates for different notification types
 * @param {string} eventType - Type of notification (book-due-reminder, password-reset, user-registration)
 * @param {Object} data - Data required for the template
 * @returns {Object} Email template with subject, HTML and text versions in multiple languages
 */
export function generateEmailTemplate(eventType, data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid template data - must be an object');
  }

  const templates = {
    subject: {
      'book-due-reminder': '📚 Library Book Due Reminder',
      'password-reset': '🔑 Password Reset Request',
      'user-register': '🎉 Welcome to NRB Library',
      'send-verification-email': '✅ Verify your Email',
      'send-password-reset-link': 'Reset your password',
      'notify-user-edit': '👋🏽 User Information Update',
      'password-changed': '🔑 Password Changed',
      'book-assigned': 'Book Issued Notification',
      'book-returned': 'Book(s) Returned Notification',
      'book-renewed': 'Book(s) Renewed Notification',
      'user-activated': 'User Activation Notification',
      'user-deactivated': 'User Deactiavtion Notification',
      'user-deleted': 'User Deletion Notification',
      'role-changed': 'Role Updated',
    },
  };

  // Verify template type is supported
  if (!templates.subject[eventType]) {
    throw new Error(`Unsupported email template type: ${eventType}`);
  }

  return {
    subject: templates.subject[eventType],
    html: generateHtmlTemplate(eventType, data),
  };
}

/**
 * Selects and generates the appropriate HTML template based on event type
 * @param {string} eventType - Type of notification
 * @param {Object} data - Template data
 * @returns {string} Generated HTML content
 */
function generateHtmlTemplate(eventType, data) {
  switch (eventType) {
    case 'book-due-reminder':
      return generateDueReminder(data);
    case 'password-reset':
      return generatePasswordReset(data);
    case 'user-register':
      return generateRegistration(data);
    case 'send-verification-email':
      return generateVerificationEmail(data);
    case 'send-password-reset-link':
      return generateResetPasswordEmail(data);
    case 'notify-user-edit':
      return generateNotifyUserEdit(data);
    case 'password-changed':
      return generatePasswordChangedEmail(data);
    case 'user-deleted':
      return generateUserDeleted(data);
    case 'user-activated':
      return generateUserActivated(data);
    case 'user-deactivated':
      return generateUserDeactivated(data);
    case 'book-assigned':
      return generateBookAssigned(data);
    case 'book-returned':
      return generateBookReturned(data);
    case 'book-renewed':
      return generateBookRenewed(data);
    case 'role-changed':
      return generateRoleChanged(data);
    default:
      throw new Error(`Unsupported email template type: ${eventType}`);
  }
}

/**
 * Generates book due reminder email
 * @param {Object} data - Template data with username and books
 * @param {string} lang - Language code
 * @returns {string} HTML template
 */
function generateDueReminder(data, lang = 'en') {
  const { username, books } = data;
  if (!username || !books) {
    throw new Error('Missing required fields for due reminder template');
  }

  const safeUsername = sanitizeInput(username);

  const translations = {
    en: {
      greeting: `Dear ${safeUsername},`,
      reminder: 'This is a friendly reminder that the following book(s) are due within 24 hours:',
      returnInfo: 'Please return them on time to avoid late fees.',
      footer: 'Best regards, NRB Library Team',
    },
  };

  const t = translations[lang];
  const bookList = books
    .map(
      (book) =>{
        const expiryDate = new Date(book.expiryDate);
        const expiryDateInNepali = calculateExpiryDate(expiryDate);
        return `<li><strong>${sanitizeInput(book.name)}</strong> 'Due by': ${expiryDateInNepali}</li>`
      }
    )
    .join('');

  return `<!DOCTYPE html>
    <html lang="${lang}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyles}
    </head>
    <body>
        <div class="email-container">
            <div class="header">${t.greeting}</div>
            <div class="content">
                <p>${t.reminder}</p>
                <ul>${bookList}</ul>
                <p>${t.returnInfo}</p>
            </div>
            <div class="footer">${t.footer}</div>
        </div>
    </body>
    </html>`;
}

/**
 * Generates password reset email
 * @param {Object} data - Template data with resetLink
 * @param {string} lang - Language code
 * @returns {string} HTML template
 */
function generatePasswordReset(data, lang = 'en') {
  const { username, resetPasswordToken } = data;
  if (!username || !resetPasswordToken)
    throw new Error('Missing resetLink for password reset template');

  const passwordResetLink = `${process.env.FRONTEND_URI}/forgot/${resetPasswordToken}`;

  const safeUsername = username ? sanitizeInput(username) : '';

  const translations = {
    en: {
      title: 'Password Reset Request',
      greeting: safeUsername ? `Hello ${safeUsername},` : 'Hello,',
      instructions: 'Click the button below to reset your password:',
      buttonText: 'Reset Password',
      expiryNote: 'This link expires in 5 minutes.',
      footer: "If you didn't request this, please ignore this email.",
    },
  };

  const t = translations[lang];

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${baseStyles}
</head>
<body>
    <div class="email-container">
        <div class="header">${t.title}</div>
        <div class="content">
            <p>${t.greeting}</p>
            <p>${t.instructions}</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${passwordResetLink}" class="button" role="button">${t.buttonText}</a>
            </p>
            <p><em>${t.expiryNote}</em></p>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; font-size: 14px;"><a href="${passwordResetLink}">${passwordResetLink}</a></p>
        </div>
        <div class="footer">${t.footer}</div>
    </div>
</body>
</html>`;
}

/**
 * Generates user registration welcome email
 * @param {Object} data - Template data with username
 * @param {string} lang - Language code
 * @returns {string} HTML template
 */
function generateRegistration(data, lang = 'en') {
  const { username, role } = data;
  if (!username) throw new Error('Missing username for registration template');

  const safeUsername = sanitizeInput(username);

  const translations = {
    en: {
      title: 'Welcome to NRB Library',
      welcome: `Welcome ${safeUsername}!`,
      content:
        role === 'ADMIN'
          ? 'Hey, you are now an admin for NRB Library.'
          : 'Congratulations, you are now a member in the NRB Library.',
      instructions: 'You can now:',
      features:
        role === 'ADMIN'
          ? [
            'Add a new book',
            'Add a new memeber',
            'Assign a book to a member',
            'Renew/Return the book for a member',
          ]
          : [
            'Browse our online catalog',
            'Reserve books up to 7 days in advance',
            'Renew books online',
            'Track your borrowing history',
          ],
      footer: 'Happy reading!',
    },
  };

  const t = translations[lang];
  const featuresList = t.features.map((f) => `<li>${f}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${baseStyles}
</head>
<body>
    <div class="email-container">
        <div class="header">${t.title}</div>
        <div class="content">
            <p>${t.welcome}</p>
            <p>${t.content}</p>
            <p>${t.instructions}</p>
            <ul>${featuresList}</ul>
        </div>
        <div>
        <div class="footer">${t.footer}</div>
    </div>
</body>
</html>`;
}

function generateVerificationEmail(data, lang = 'en') {
  const { username, verificationToken } = data;
  if (!username) throw new Error('Missing credentials for sending email');

  const verificationLink = `${process.env.API_BASE_URI}/common/verifyemail?token=${verificationToken}`;

  const safeUsername = sanitizeInput(username);
  const translations = {
    en: {
      title: 'VERIFY YOUR EMAIL ADDRESS',
      welcome: `Hey, ${safeUsername}!`,
      content: 'Please verify your email through the given link.',
      footer: 'Happy reading!',
    },
  };

  const t = translations[lang];

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${baseStyles}
</head>
<body>
    <div class="email-container">
        <div class="header">${t.title}</div>
        <div class="content">
            <p>${t.welcome}</p>
            <p>${t.content}
                <a href="${verificationLink}">Verify Email</a>
            </p>
            <p>If the above link doesnot work you can copy the link below and paste it in your browser tab</p>
            <p>${verificationLink}</p>
        </div>
        <div>
        <div class="footer">${t.footer}</div>
    </div>
</body>
</html>`;
}

function generateNotifyUserEdit(data, lang = 'en') {
  const { username } = data;
  if (!username) throw new Error('Missing credentials for sending email');

  const safeUsername = sanitizeInput(username);
  const translations = {
    en: {
      title: 'PERSONAL INFORMATION CHANGED',
      welcome: `Hey, ${safeUsername}!`,
      content:
        'Your profile information has been edited/updated. If you are not aware or not the one who did this, please contact the library administrator.',
      footer: 'Happy reading!',
    },
  };

  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
          </div>
          <div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generatePasswordChangedEmail(data, lang = 'en') {
  const { username } = data;
  if (!username) throw new Error('Missing credentials for sending email');

  const safeUsername = sanitizeInput(username);
  const translations = {
    en: {
      title: 'PASSWORD CHANGED',
      welcome: `Hey, ${safeUsername}!`,
      content:
        'Your password has been changed. If you are not the one who changed the password, please contact the library administration',
      footer: 'Happy reading!',
    },
  };

  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
          </div>
          <div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateUserActivated(data, lang = 'en') {
  const { username } = data;
  if (!username) throw new Error('Missing credentials for sending email');

  const safeUsername = sanitizeInput(username);
  const translations = {
    en: {
      title: 'ACCOUNT ACTIVATED',
      welcome: `Hey, ${safeUsername}!`,
      content: 'Your account has been activated. You can now access all library services.',
      footer: 'Happy reading!',
    },
  };

  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
          </div>
          <div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateUserDeactivated(data, lang = 'en') {
  const { username } = data;
  if (!username) throw new Error('Missing credentials for sending email');

  const safeUsername = sanitizeInput(username);
  const translations = {
    en: {
      title: 'ACCOUNT DEACTIVATED',
      welcome: `Dear ${safeUsername},`,
      content:
        'Your account has been temporarily deactivated. If you believe you have not violated any of the rules of the library, please contact the library administration.',
      footer: 'NRB Library Team',
    },
  };

  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
          </div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateBookAssigned(data, lang = 'en') {
  const { username, bookInfo } = data;
  if (!username || !bookInfo || !Array.isArray(bookInfo)) {
    throw new Error('Missing or invalid data for book assignment email');
  }

  const safeUsername = sanitizeInput(username);



  // Format the book entries
  const bookListHTML = bookInfo
    .map((book) => {
      const safeBookName = sanitizeInput(book.name);
      const expiryDate = new Date(book.expiryDate)
      const expiryDateInNepali = calculateExpiryDate(expiryDate)
      return `
      <li>
        <strong>${safeBookName}</strong> – Due on: <strong>${expiryDateInNepali}</strong>
      </li>
    `;
    })
    .join('');

  const translations = {
    en: {
      title: 'BOOK(S) ISSUED',
      welcome: `Hello ${safeUsername},`,
      contentIntro: 'You have been issued the following books:',
      reminder: 'Please return the books on time to avoid late fees.',
      footer: 'NRB Library Team',
    },
  };

  const t = translations[lang];

  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.contentIntro}</p>
              <ul>${bookListHTML}</ul>
              <p>${t.reminder}</p>
          </div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateBookRenewed(data, lang = 'en') {
  const { username, bookInfo } = data;
  if (!username || !bookInfo || !Array.isArray(bookInfo))
    throw new Error('Missing or invalid data for book renewal email');

  const safeUsername = sanitizeInput(username);


  const bookListHtml = bookInfo
    .map((book) => {
      const safeBookName = sanitizeInput(book.bookName);
      const expiryDate = new Date(book.expiryDate);
      const expiryDateInNepali = calculateExpiryDate(expiryDate);
      return `
      <li>
        <strong>${safeBookName}</strong> – Due on: <strong>${expiryDateInNepali}</strong>
      </li>
    `;
    })
    .join('');

  const translations = {
    en: {
      title: 'BOOK(S) RENEWED',
      welcome: `Hello ${safeUsername},`,
      contentIntro: 'You have renewed the following books:',
      reminder: 'Please return the book on time to avoid late fees.',
      footer: 'NRB Library Team',
    },
  };

  const t = translations[lang];

  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.contentIntro}</p>
              <p>${bookListHtml}</p>
              <p>${t.reminder}</p>
          </div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateBookReturned(data, lang = 'en') {
  const { username, bookInfo } = data;
  if (!username || !bookInfo) throw new Error('Missing data for book return email');

  const safeUsername = sanitizeInput(username);
  const bookListHTML = bookInfo
    .map((book) => `<li><strong>${sanitizeInput(book.bookName)}</strong></li>`)
    .join('');

  const translations = {
    en: {
      title: 'BOOK(S) RETURNED',
      welcome: `Hello ${safeUsername},`,
      content: 'The following book(s) have been successfully returned:',
      thankYou: 'Thank you for returning them. Visit us again soon!',
      footer: 'NRB Library Team',
    },
  };

  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
              <ul>${bookListHTML}</ul>
              <p>${t.thankYou}</p>
          </div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateUserDeleted(data, lang = 'en') {
  const { username } = data;
  if (!username) throw new Error('Missing credentials for sending email');

  const safeUsername = sanitizeInput(username);
  const translations = {
    en: {
      title: 'ACCOUNT DELETED',
      welcome: `Dear ${safeUsername},`,
      content:
        'Your account has been deleted from our system. If you believe this was done in error, please contact the library administration.',
      footer: 'NRB Library Team',
    },
  };

  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
          </div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateResetPasswordEmail(data, lang = 'en') {
  const { username, resetLink } = data;
  if (!username || !resetLink) throw new Error('Missing data for password reset email');

  const safeUsername = sanitizeInput(username);

  const translations = {
    en: {
      title: 'RESET YOUR PASSWORD',
      welcome: `Hello ${safeUsername},`,
      content:
        'We received a request to reset your password. Click the button below to create a new password:',
      buttonText: 'Reset Password',
      expiryNote: 'This link will expire in 15 minutes for security reasons.',
      ignoreMessage:
        'If you did not request a password reset, please ignore this email or contact support if you have concerns.',
      footer: 'NRB Library Team',
    },
  };

  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
              <p style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" class="button" role="button">${t.buttonText}</a>
              </p>
              <p><em>${t.expiryNote}</em></p>
              <p>${t.ignoreMessage}</p>
              <p>If the button doesn't work, copy and paste this URL into your browser:</p>
              <p style="word-break: break-all; font-size: 14px;"><a href="${resetLink}">${resetLink}</a></p>
          </div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}

function generateRoleChanged(data, lang = 'en') {
  const { username, role } = data;

  if (!username || !role) {
    throw new Error('Missing data for sending email for changing role.');
  }

  const safeUsername = sanitizeInput(username);
  if (role === 'ADMIN') {
  }

  const translations = {
    en: {
      title: 'ROLE CHANGED',
      welcome: `Hello ${safeUsername},`,
      content:
        role === 'ADMIN'
          ? 'You have been promoted to be an admin for the NRB Library Management System.'
          : 'You have been demoted to a member for the NRB Library Management System',
      footer: 'NRB Library Team',
    },
  };
  const t = translations[lang];
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
  </head>
  <body>
      <div class="email-container">
          <div class="header">${t.title}</div>
          <div class="content">
              <p>${t.welcome}</p>
              <p>${t.content}</p>
          </div>
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
}
