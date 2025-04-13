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
        ...(data && { data })
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
        ...(process.env.NODE_ENV === 'development' && error && { error })
    });
}; 