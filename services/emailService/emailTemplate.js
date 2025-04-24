/**
 * Email Template Manager
 * 
 * Handles generation of HTML and plain text email templates with multilingual support.
 * Supports multiple notification types including book reminders, password resets, and welcome emails.
 */

import { baseStyles } from "./template-style.js";
import { sanitizeInput, formatLocalizedDate } from "./utilities.js";


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
            'send-password-reset-link': 'Reset your password'
        }
    };

    // Verify template type is supported
    if (!templates.subject[eventType]) {
        throw new Error(`Unsupported email template type: ${eventType}`);
    }

    return {
        subject: templates.subject[eventType],
        html: generateHtmlTemplate(eventType, data)
    };
}

/**
 * Selects and generates the appropriate HTML template based on event type
 * @param {string} eventType - Type of notification
 * @param {Object} data - Template data
 * @param {string} lang - Language code (en or ne)
 * @returns {string} Generated HTML content
 */
function generateHtmlTemplate(eventType, data, lang = 'en') {
    switch (eventType) {
        case 'book-due-reminder':
            return generateDueReminder(data, lang);
        case 'password-reset':
            return generatePasswordReset(data, lang);
        case 'user-register':
            return generateRegistration(data, lang);
        case 'send-verification-email':
            return generateVerificationEmail(data, lang);
        case 'send-password-reset-link':
            return generateResetPasswordEmail(data, lang);
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
            footer: 'Best regards, NRB Library Team'
        }
    };

    const t = translations[lang];
    const bookList = books.map(book =>
        `<li><strong>${sanitizeInput(book.name)}</strong> (${lang === 'ne' ? 'अन्तिम मिति' : 'Due by'}: ${formatLocalizedDate(book.expiryDate, lang)})</li>`
    ).join('');

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
    if (!username || !resetPasswordToken) throw new Error('Missing resetLink for password reset template');

    const passwordResetLink = `${process.env.FRONTEND_URI}/forgot/${resetPasswordToken}`;

    const safeUsername = username ? sanitizeInput(username) : ''

    const translations = {
        en: {
            title: 'Password Reset Request',
            greeting: safeUsername ? `Hello ${safeUsername},` : 'Hello,',
            instructions: 'Click the button below to reset your password:',
            buttonText: 'Reset Password',
            expiryNote: 'This link expires in 5 minutes.',
            footer: 'If you didn\'t request this, please ignore this email.'
        }
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
            content: role === 'ADMIN' ? 'Hey, you are now an admin for NRB Library.' : 'Congratulations, you are now a member in the NRB Library.',
            instructions: 'You can now:',
            features: role === "ADMIN" ? [
                'Add a new book',
                'Add a new memeber',
                'Assign a book to a member',
                'Renew/Return the book for a member'
            ] : [
                'Browse our online catalog',
                'Reserve books up to 7 days in advance',
                'Renew books online',
                'Track your borrowing history'
            ],
            footer: 'Happy reading!'
        }
    };

    const t = translations[lang];
    const featuresList = t.features.map(f => `<li>${f}</li>`).join('');

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
    const { username, verificationToken, role } = data;
    if (!username) throw new Error('Missing credentials for sending email');

    const verificationLink = `${process.env.API_BASE_URI}/common/verifyemail?token=${verificationToken}`

    const safeUsername = sanitizeInput(username);
    const translations = {
        en: {
            title: 'VERIFY YOUR EMAIL ADDRESS',
            welcome: `Welcome ${safeUsername}!`,
            content: 'Please verify your email through the given link.',
            footer: 'Happy reading!'
        }
    }

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
