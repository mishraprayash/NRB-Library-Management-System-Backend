/**
 * Authentication Controller
 *
 * Handles user authentication including login, admin registration, and
 * superadmin registration. Implements secure password handling, JWT generation,
 * and role-based access management.
 */

import { sendResponse, sendError } from '../lib/responseHelper.js';
import * as authService from '../services/auth.service.js';
import { setCookie } from '../lib/helpers.js';

/**
 * Handles user login authentication and session creation
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with authentication status and token
 */

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authService.getMemberByUsername(username);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    if (!user.isActive) {
      return sendError(res, 400, 'You account has been deactivated by the superadmin');
    }
    const passwordValid = await authService.verifyPassword(password, user.password);
    if (!passwordValid) {
      return sendError(res, 401, 'Invalid credentials');
    }
    // Generate JWT token
    const accessToken = authService.generateAccessToken(user);
    // Set authentication cookies
    const isCookieSet = setCookie(res, accessToken, user.role);
    if (!isCookieSet) {
      return sendError(res, 500, 'Failed to create session');
    }
    // Return success response with minimal user information
    return sendResponse(res, 200, 'Login successful', {
      role: user.role,
      token: accessToken,
      username: user.username,
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Generic registration function for creating admin and superadmin users
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {String} role - Role to assign ('ADMIN' or 'SUPERADMIN')
 * @returns {Object} Response with registration status
 */
const registerUser = async (req, res, role) => {
  try {
    const { name, username, email, password, phoneNo, designation } = req.body;
    const result = await authService.createMember(
      { name, username, email, password, phoneNo, designation },
      role
    );
    if (result.error) {
      return sendError(res, result.status, result.message);
    }
    return sendResponse(
      res,
      201,
      `${role === 'ADMIN' ? 'Admin' : 'Super Admin'} created successfully`,
      {
        id: result.id,
        username: result.username,
        role: result.role,
        createdAt: result.createdAt,
      }
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Creates an admin user if none exists
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with registration status
 */
export const registerAdmin = async (req, res) => {
  return registerUser(req, res, 'ADMIN');
};

/**
 * Creates a superadmin user if none exists
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with registration status
 */
export const registerSuperAdmin = async (req, res) => {
  return registerUser(req, res, 'SUPERADMIN');
};
