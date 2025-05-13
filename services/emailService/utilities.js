/**
 * Converts HTML email content to plain text
 * @param {string} html - The HTML content to convert
 * @returns {string} Plain text version of the email
 */
export function generatePlainTextVersion(html) {
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
export function formatLocalizedDate(dateString, lang) {
  const date = new Date(dateString);
  return date.toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Sanitizes user input to prevent HTML injection
 * @param {string} input - The user input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


export function convertToNepaliTime(isoDateStr) {
  const date = new Date(isoDateStr);
  // Offset in milliseconds: 5 hours 45 minutes = (5 * 60 + 45) * 60 * 1000
  const nptOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const nepaliTime = new Date(date.getTime() + nptOffsetMs);
  return nepaliTime;
}