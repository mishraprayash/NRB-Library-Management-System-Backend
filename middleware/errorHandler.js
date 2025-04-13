import { sendError } from '../lib/responseHelper.js';

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    return sendError(
        res,
        err.statusCode || 500,
        err.message || 'Internal Server Error',
        process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
};
