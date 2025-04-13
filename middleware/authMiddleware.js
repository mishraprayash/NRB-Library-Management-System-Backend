/**
 * Authentication and Authorization Middleware
 * 
 * Provides centralized middleware for authenticating requests and authorizing
 * users based on their roles. Supports both JWT Bearer token and cookie-based
 * authentication with role-based access control.
 */

import jwt from "jsonwebtoken";
import JsonWebTokenError from "jsonwebtoken/lib/JsonWebTokenError.js";

/**
 * Authentication error response helper
 * 
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {string} details - Additional error context
 * @returns {Object} Response object
 */
const authError = (res, status, message, details) => {
  return res.status(status).json({ 
    message,
    details: details || undefined
  });
};

/**
 * Generic authentication middleware
 * 
 * @param {Function} tokenExtractor - Function that extracts the token from the request
 * @returns {Function} Express middleware
 */
const createAuthMiddleware = (tokenExtractor) => {
  return async (req, res, next) => {
    try {
      // Extract token using the provided function
      const token = tokenExtractor(req);
      
      if (!token) {
        return authError(res, 401, "Authentication required", "No token provided");
      }
      
      // Verify and decode token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decodedToken;
      next();
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        return authError(res, 401, "Authentication failed", "Invalid or expired token");
      }
      
      console.error("Authentication error:", error);
      return authError(res, 500, "Internal server error", "Error during authentication");
    }
  };
};

/**
 * Extract token from Authorization header
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} The token or null if not found
 */
const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1] || null;
};

/**
 * Extract token from cookies
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} The token or null if not found
 */
const extractCookieToken = (req) => {
  return req.cookies?.token || null;
};

/**
 * Create a role-based authorization middleware
 * 
 * @param {Function} roleMatcher - Function that determines if user has required role(s)
 * @param {string} errorMessage - Error message when access is denied
 * @returns {Function} Express middleware
 */
const createRoleMiddleware = (roleMatcher, errorMessage) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return authError(res, 401, "Authentication required", "User is not authenticated");
      }

      // Check if the user's role matches the required role(s)
      if (roleMatcher(req.user.role)) {
        next();
      } else {
        return authError(res, 403, "Access denied", errorMessage);
      }
    } catch (error) {
      console.error("Role validation error:", error);
      return authError(res, 500, "Internal server error", "Error validating permissions");
    }
  };
};

// Middleware for JWT authentication via Authorization header
export const isAuthorized = createAuthMiddleware(extractBearerToken);

// Middleware for JWT authentication via cookies
export const isCookieAuthorized = createAuthMiddleware(extractCookieToken);

// Middleware for admin and superadmin access
export const admin_superAdmin_both = createRoleMiddleware(
  (role) => role === "ADMIN" || role === "SUPERADMIN",
  "This operation requires administrator privileges"
);

// Middleware for superadmin access only
export const super_admin_only = createRoleMiddleware(
  (role) => role === "SUPERADMIN",
  "This operation requires superadmin privileges"
);

// Middleware for member access only
export const member_only = createRoleMiddleware(
  (role) => role === "MEMBER",
  "This operation is only available to library members"
);

/**
 * Middleware that checks if the user has any of the specified roles
 * 
 * @param {...string} allowedRoles - Roles that should be allowed access
 * @returns {Function} Express middleware
 */
export const hasAnyRole = (...allowedRoles) => {
  return createRoleMiddleware(
    (role) => allowedRoles.includes(role),
    `This operation requires one of these roles: ${allowedRoles.join(", ")}`
  );
};