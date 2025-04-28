import { Router } from 'express';
import { login, registerAdmin, registerSuperAdmin } from '../controllers/auth.controller.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { userLoginSchema, userRegisterSchema } from '../validation/schema.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication API endpoints
 */

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     description: Authenticates a user and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       example: ADMIN
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     username:
 *                       type: string
 *                       example: admin123
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.route('/login').post(validateSchema(userLoginSchema), login);

/**
 * @swagger
 * /api/v1/admin/register:
 *   post:
 *     summary: Register an admin
 *     tags: [Authentication]
 *     description: Creates a new admin account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *               - phoneNo
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               username:
 *                 type: string
 *                 description: User's username
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               password:
 *                 type: string
 *                 description: User's password
 *               phoneNo:
 *                 type: string
 *                 description: User's phone number
 *               designation:
 *                 type: string
 *                 description: User's job designation
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Server error
 */
router.route('/admin/register').post(validateSchema(userRegisterSchema), registerAdmin);

/**
 * @swagger
 * /api/v1/superadmin/register:
 *   post:
 *     summary: Register a superadmin
 *     tags: [Authentication]
 *     description: Creates a new superadmin account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Super Admin created successfully
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Server error
 */
router.route('/superadmin/register').post(validateSchema(userRegisterSchema), registerSuperAdmin);

export default router;
