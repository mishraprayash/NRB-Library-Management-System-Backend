/**
 * Authentication and Authorization Middleware
 * Handles user authentication and role-based access control
 */

import jwt from "jsonwebtoken";
import pkg from 'jsonwebtoken';
const { JsonWebTokenError } = pkg;

// Helper function to send authentication errors
const sendAuthError = (res, status, message, details = null) => {
  return res.status(status).json({ message, details });
};

// Get token from cookies
const getTokenFromCookie = (req) => {
  return { accessToken: req.cookies?.token || null };
};

// Verify JWT token and attach user to request
const verifyToken = async (req, res, next) => {
  try {
    const { accessToken } = getTokenFromCookie(req);

    if (!accessToken) {
      return sendAuthError(res, 401, "Authentication required", "No token provided");
    }

    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return sendAuthError(res, 401, "Authentication failed", "Invalid or expired token");
    }
    console.error("Authentication error:", error);
    return sendAuthError(res, 500, "Internal server error", "Error during authentication");
  }
};

// Check if user has required role
const checkRole = (role, allowedRoles) => {
  return allowedRoles.includes(role);
};

// Create role-based middleware
const createRoleMiddleware = (allowedRoles, errorMessage) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return sendAuthError(res, 401, "Authentication required", "User is not authenticated");
      }

      if (checkRole(req.user.role, allowedRoles)) {
        next();
      } else {
        return sendAuthError(res, 403, "Access denied", errorMessage);
      }
    } catch (error) {
      console.error("Role validation error:", error);
      return sendAuthError(res, 500, "Internal server error", "Error validating permissions");
    }
  };
};

// Export middleware functions
export const isCookieAuthorized = verifyToken;

export const admin_superAdmin_both = createRoleMiddleware(
  ["ADMIN", "SUPERADMIN"],
  "This operation requires administrator privileges"
);

export const super_admin_only = createRoleMiddleware(
  ["SUPERADMIN"],
  "This operation requires superadmin privileges"
);

export const member_only = createRoleMiddleware(
  ["MEMBER"],
  "This operation is only available to library members"
);