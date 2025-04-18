/**
 * Authentication Controller
 * 
 * Handles user authentication including login, admin registration, and
 * superadmin registration. Implements secure password handling, JWT generation,
 * and role-based access management.
 */

import { setCookie } from "../../lib/helpers.js";
import * as authService from "../../services/authService.js"
import { sendResponse, sendError } from "../../lib/responseHelper.js";


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
      return sendError(res, 404, "User not found");
    }

    // Verify password
    const passwordValid = await authService.verifyPassword(password, user.password);
    if (!passwordValid) {
      return sendError(res, 401, "Invalid credentials");
    }

    // Generate JWT token
    const accessToken = authService.generateAccessToken(user);
    // const refreshToken = authService.generateRefreshToken(user);

    // Set authentication cookies
    const isCookieSet = setCookie(res, accessToken, user.role);
    if (!isCookieSet) {
      return sendError(res, 500, "Failed to create session");
    }

    // Return success response with minimal user information
    return sendResponse(res, 200, "Login successful", {
      role: user.role,
      token: accessToken,
      username: user.username
    });
  }
  catch (error) {
    // Let the global error handler deal with unexpected errors
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
    const { name, username, email, password, phoneNo } = req.body;

    // create a user for the given userData 
    const result = await authService.createMember({ name, username, email, password, phoneNo }, role);

    // Check if the result contains an error
    if (result.error) {
      return sendError(res, result.status, result.message);
    }

    // Return success response
    return sendResponse(res, 201, `${role === 'ADMIN' ? 'Admin' : 'Super Admin'} created successfully`, {
      id: result.id,
      username: result.username,
      role: result.role,
      createdAt: result.createdAt
    });
  } catch (error) {
    // Let the global error handler deal with unexpected errors
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
  return registerUser(req, res, 'SUPERADMIN')
};

/**
 * Logs out the current user by clearing auth cookies
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with logout status
 */
export const logout = async (req, res) => {
  try {
    // Clear auth cookies
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return sendResponse(res, 200, "Logged out successfully");
  } catch (error) {
    // Let the global error handler deal with unexpected errors
    throw error;
  }
};