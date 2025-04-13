import { Router } from "express";

import { login, registerAdmin, registerSuperAdmin } from "../controllers/auth/authController.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { userLoginSchema, userRegisterSchema } from "../validation/schema.js";

const router = Router();

/**
 * @description Authentication routes
 * @basePath /api/v1/auth
 */

/**
 * @route POST /login
 * @description Authenticate user and create session
 * @access Public
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Object} User session information
 * @example
 * // Request
 * {
 *   "username": "john_doe",
 *   "password": "password123"
 * }
 * 
 * // Response
 * {
 *   "status": "success",
 *   "message": "Login successful",
 *   "data": {
 *     "token": "jwt_token_here",
 *     "role": "MEMBER",
 *     "username": "john_doe"
 *   }
 * }
 */
router.route('/login').post(validateSchema(userLoginSchema), login);

/**
 * @route POST /admin/register
 * @description Register a new admin user
 * @access Public (initial setup only)
 * @param {string} name - Admin's full name
 * @param {string} username - Admin's username
 * @param {string} email - Admin's email address
 * @param {string} password - Admin's password
 * @param {string} phoneNo - Admin's phone number
 * @returns {Object} Created admin information
 * @example
 * // Request
 * {
 *   "name": "John Doe",
 *   "username": "admin_john",
 *   "email": "john@example.com",
 *   "password": "securePassword123",
 *   "phoneNo": "1234567890"
 * }
 * 
 * // Response
 * {
 *   "status": "success",
 *   "message": "Admin created successfully",
 *   "data": {
 *     "id": 1,
 *     "username": "admin_john",
 *     "role": "ADMIN",
 *     "createdAt": "2024-04-08T12:00:00Z"
 *   }
 * }
 */
router.route('/admin/register').post(validateSchema(userRegisterSchema), registerAdmin);

/**
 * @route POST /superadmin/register
 * @description Register a new superadmin user
 * @access Public (initial setup only)
 * @param {string} name - Superadmin's full name
 * @param {string} username - Superadmin's username
 * @param {string} email - Superadmin's email address
 * @param {string} password - Superadmin's password
 * @param {string} phoneNo - Superadmin's phone number
 * @returns {Object} Created superadmin information
 * @example
 * // Request
 * {
 *   "name": "Jane Smith",
 *   "username": "super_jane",
 *   "email": "jane@example.com",
 *   "password": "securePassword123",
 *   "phoneNo": "9876543210"
 * }
 * 
 * // Response
 * {
 *   "status": "success",
 *   "message": "Super Admin created successfully",
 *   "data": {
 *     "id": 1,
 *     "username": "super_jane",
 *     "role": "SUPERADMIN",
 *     "createdAt": "2024-04-08T12:00:00Z"
 *   }
 * }
 */
router.route('/superadmin/register').post(validateSchema(userRegisterSchema), registerSuperAdmin);

export default router

