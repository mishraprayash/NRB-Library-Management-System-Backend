/**
 * Email Template Manager
 * 
 * Handles generation of HTML and plain text email templates with multilingual support.
 * Supports multiple notification types including book reminders, password resets, and welcome emails.
 */

// Define theme colors for easier maintenance and branding changes
const theme = {
    primary: '#3498db',
    secondary: '#2c3e50',
    background: '#f5f5f5',
    text: '#333333',
    muted: '#7f8c8d'
  };
  
  // Base email styles used across all templates
  const baseStyles = `
      <style>
          body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: ${theme.text};
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: ${theme.background};
          }
          .email-container {
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              padding: 25px;
          }
          .header {
              color: ${theme.secondary};
              font-size: 22px;
              margin-bottom: 15px;
              font-weight: bold;
          }
          .content {
              margin: 15px 0;
          }
          .button {
              background-color: ${theme.primary};
              color: white !important;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              font-weight: bold;
          }
          .button:hover {
              opacity: 0.9;
          }
          .footer {
              font-size: 14px;
              color: ${theme.muted};
              text-align: center;
              margin-top: 25px;
          }
          ul {
              padding-left: 20px;
          }
          /* Responsive design for mobile devices */
          @media only screen and (max-width: 480px) {
              .button {
                  display: block;
                  text-align: center;
                  width: 100%;
              }
          }
          [data-ogsc] .button {
              background-color: ${theme.primary} !important;
              color: white !important;
          }
      </style>
  `;
  
  /**
   * Converts HTML email content to plain text
   * @param {string} html - The HTML content to convert
   * @returns {string} Plain text version of the email
   */
  function generatePlainTextVersion(html) {
      return html
          .replace(/<style[^>]*>.*<\/style>/gs, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\n\s+/g, '\n')
          .trim();
  }
  
  /**
   * Formats a date according to the specified language
   * @param {string|Date} dateString - The date to format
   * @param {string} lang - Language code (en or ne)
   * @returns {string} Localized date string
   */
  function formatLocalizedDate(dateString, lang) {
      const date = new Date(dateString);
      return date.toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });
  }
  
  /**
   * Sanitizes user input to prevent HTML injection
   * @param {string} input - The user input to sanitize
   * @returns {string} Sanitized string
   */
  function sanitizeInput(input) {
      if (typeof input !== 'string') return '';
      return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
  }
  
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
              'user-registration': '🎉 Welcome to NRB Library'
          }
      };
  
      // Verify template type is supported
      if (!templates.subject[eventType]) {
          throw new Error(`Unsupported email template type: ${eventType}`);
      }
  
      return {
          subject: templates.subject[eventType],
          html: generateHtmlTemplate(eventType, data),
          text: generatePlainTextVersion(generateHtmlTemplate(eventType, data)),
          html_ne: generateHtmlTemplate(eventType, data, 'ne'),
          text_ne: generatePlainTextVersion(generateHtmlTemplate(eventType, data, 'ne'))
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
      switch(eventType) {
          case 'book-due-reminder':
              return generateDueReminder(data, lang);
          case 'password-reset':
              return generatePasswordReset(data, lang);
          case 'user-registration':
              return generateRegistration(data, lang);
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
          },
          ne: {
              greeting: `प्रिय ${safeUsername},`,
              reminder: 'तलका पुस्तक(हरू) २४ घण्टाभित्र फिर्ता गर्नुपर्नेछ:',
              returnInfo: 'ढिला शुल्कबाट बच्न समयमा फिर्ता गर्नुहोला।',
              footer: 'शुभकामना, एनआरबी लाइब्रेरी टीम'
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
      const { username, resetLink } = data;
      if (!resetLink) throw new Error('Missing resetLink for password reset template');
  
      const safeUsername = username ? sanitizeInput(username) : '';
      const safeResetLink = sanitizeInput(resetLink);
  
      const translations = {
          en: {
              title: 'Password Reset Request',
              greeting: safeUsername ? `Hello ${safeUsername},` : 'Hello,',
              instructions: 'Click the button below to reset your password:',
              buttonText: 'Reset Password',
              expiryNote: 'This link expires in 1 hour.',
              footer: 'If you didn\'t request this, please ignore this email.'
          },
          ne: {
              title: 'पासवर्ड रिसेट अनुरोध',
              greeting: safeUsername ? `नमस्ते ${safeUsername},` : 'नमस्ते,',
              instructions: 'पासवर्ड रिसेट गर्न तलको बटनमा क्लिक गर्नुहोस्:',
              buttonText: 'पासवर्ड रिसेट गर्नुहोस्',
              expiryNote: 'यो लिंक १ घण्टामा समाप्त हुनेछ।',
              footer: 'यदि तपाईंले यो अनुरोध गर्नुभएन भने, यो इमेल बेवास्ता गर्नुहोला।'
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
                  <a href="${safeResetLink}" class="button" role="button">${t.buttonText}</a>
              </p>
              <p><em>${t.expiryNote}</em></p>
              <p>If the button doesn't work, copy and paste this URL into your browser:</p>
              <p style="word-break: break-all; font-size: 14px;"><a href="${safeResetLink}">${safeResetLink}</a></p>
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
      const { username } = data;
      if (!username) throw new Error('Missing username for registration template');
  
      const safeUsername = sanitizeInput(username);
  
      const translations = {
          en: {
              title: 'Welcome to NRB Library',
              welcome: `Welcome ${safeUsername}!`,
              content: 'Your library account has been successfully created.',
              instructions: 'You can now:',
              features: [
                  'Browse our online catalog',
                  'Reserve books up to 7 days in advance',
                  'Renew books online',
                  'Track your borrowing history'
              ],
              footer: 'Happy reading!'
          },
          ne: {
              title: 'एनआरबी लाइब्रेरीमा स्वागत छ',
              welcome: `स्वागत छ ${safeUsername}!`,
              content: 'तपाईंको लाइब्रेरी खाता सफलतापूर्वक सिर्जना गरिएको छ।',
              instructions: 'तपाईं अहिलेबाट यी गर्न सक्नुहुनेछ:',
              features: [
                  'हाम्रो अनलाइन क्याटालग हेर्न',
                  'पुस्तकहरू ७ दिन अगाडि आरक्षण गर्न',
                  'पुस्तकहरू अनलाइन नविकरण गर्न',
                  'तपाईंको उधारी इतिहास ट्र्याक गर्न'
              ],
              footer: 'पठनको आनन्द लिनुहोस्!'
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
          <div class="footer">${t.footer}</div>
      </div>
  </body>
  </html>`;
  }