/**
 * Standard API response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {Object} [data] - Response data
 * @param {string} [status] - Response status (success/error)
 * @returns {Object} Formatted response
 */
export const sendResponse = (res, statusCode, message, data = null, status = 'success') => {
  return res.status(statusCode).json({
    status,
    message,
    ...(data && { data }),
  });
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} [error] - Error details (development only)
 * @returns {Object} Formatted error response
 */
export const sendError = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && error && { error }),
  });
};

export const sendEmailVerificationResponse = (res, statusCode, message, error = null) => {
  return res.status(statusCode).set('Content-Type', 'text/html; charset=UTF-8')
    .send(`<!DOCTYPE html>
<html>
<head>
    <title>Email Verified</title>
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
    <h1 style="color: #2ecc71;">${message} 🎉</h1>
    <p style="font-size: 16px;">You may now log in to your account.</p>
    <a href="${process.env.FRONTEND_URI}/login" style="display: inline-block; background-color: #2ecc71; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Login</a>
</body>
</html>`);
};

export const sendEmailVerificationError = (res, statusCode, message, error = null) => {
  return res.status(statusCode).set('Content-Type', 'text/html; charset=UTF-8')
    .send(`<!DOCTYPE html>
<html>
<head>
    <title>Verification Failed</title>
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
    <h1 style="color: #e74c3c;">Verification Failed ❌</h1>
    <p style="font-size: 16px;">${message}</p>
    <a href="${process.env.FRONTEND_URI}/login" style="display: inline-block; background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Login</a>
</body>
</html>`);
};
