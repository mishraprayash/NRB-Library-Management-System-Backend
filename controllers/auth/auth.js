/**
 * Authentication Controller
 * 
 * Handles user authentication including login, admin registration, and
 * superadmin registration. Implements secure password handling, JWT generation,
 * and role-based access management.
 */

import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie } from "../../lib/helpers.js";

// Constants
const SALT_ROUNDS = 10;
const REQUIRED_USER_FIELDS = ['name', 'username', 'email', 'password', 'phoneNo'];

/**
 * Helper function to validate required request fields
 * 
 * @param {Object} fields - Object containing the request fields
 * @param {Array} required - Array of required field names
 * @returns {string|null} Error message if validation fails, null otherwise
 */
const validateFields = (fields, required = REQUIRED_USER_FIELDS) => {
  const missingFields = required.filter(field => !fields[field]);
  
  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }
  
  return null;
};

/**
 * Handles user login authentication and session creation
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with authentication status and token
 */
export const login = async (req, res) => {
  try {
    // Validate required fields
    const { username, password } = req.body;
    const validationError = validateFields({ username, password }, ['username', 'password']);
    
    if (validationError) {
      return res.status(400).json({ 
        message: validationError,
        status: "error"
      });
    }

    // Find user in database
    const user = await prisma.member.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ 
        message: "User not found", 
        status: "error" 
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ 
        message: "Invalid credentials", 
        status: "error" 
      });
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_LIFETIME || '24h' }
    );

    // Set authentication cookies
    const isCookieSet = setCookie(res, accessToken, user.role);
    if (!isCookieSet) {
      return res.status(500).json({ 
        message: "Failed to create session", 
        status: "error" 
      });
    }

    // Return success response with minimal user information
    return res.status(200).json({ 
      message: 'Login successful',
      status: "success", 
      data: {
        token: accessToken,
        role: user.role,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      message: "An unexpected error occurred", 
      status: "error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
  try {
    // Validate required fields
    const { name, username, email, password, phoneNo } = req.body;
    const validationError = validateFields({ name, username, email, password, phoneNo });
    
    if (validationError) {
      return res.status(400).json({
        message: validationError,
        status: "error"
      });
    }

    // Check for existing admin or username conflict
    const existingCheck = await prisma.member.findFirst({
      where: {
        OR: [
          { username },
          { role: "ADMIN" }
        ]
      },
      select: {
        username: true,
        role: true
      }
    });

    if (existingCheck) {
      const message = existingCheck.username === username 
        ? "Username already exists"
        : "Admin already exists. You cannot create more than one admin.";
      
      return res.status(409).json({ 
        message,
        status: "error"
      });
    }

    // Hash password and create admin user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const admin = await prisma.member.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        phoneNo,
        role: 'ADMIN'
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Return success response
    return res.status(201).json({ 
      message: "Admin created successfully",
      status: "success",
      data: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    return res.status(500).json({ 
      message: "An unexpected error occurred", 
      status: "error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Creates a superadmin user if none exists
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with registration status
 */
export const registerSuperAdmin = async (req, res) => {
  try {
    // Validate required fields
    const { name, username, email, password, phoneNo } = req.body;
    const validationError = validateFields({ name, username, email, password, phoneNo });
    
    if (validationError) {
      return res.status(400).json({
        message: validationError,
        status: "error"
      });
    }

    // Check for existing superadmin or username conflict
    const existingCheck = await prisma.member.findFirst({
      where: {
        OR: [
          { username },
          { role: "SUPERADMIN" }
        ]
      },
      select: {
        username: true,
        role: true
      }
    });

    if (existingCheck) {
      const message = existingCheck.username === username 
        ? "Username already exists"
        : "Super admin already exists. You cannot create more than one super admin.";
      
      return res.status(409).json({ 
        message,
        status: "error"
      });
    }

    // Hash password and create superadmin user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const superAdmin = await prisma.member.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        phoneNo,
        role: 'SUPERADMIN'
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Return success response
    return res.status(201).json({ 
      message: "Super Admin created successfully",
      status: "success",
      data: {
        id: superAdmin.id,
        username: superAdmin.username,
        role: superAdmin.role,
        createdAt: superAdmin.createdAt
      }
    });
  } catch (error) {
    console.error("Super admin registration error:", error);
    return res.status(500).json({ 
      message: "An unexpected error occurred", 
      status: "error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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
    res.clearCookie('token');
    res.clearCookie('role');
    
    return res.status(200).json({ 
      message: "Logged out successfully",
      status: "success"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ 
      message: "An unexpected error occurred during logout", 
      status: "error"
    });
  }
};