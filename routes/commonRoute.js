import express from "express";

import {
    updateMyProfileDetails,
    resetPassword,
    getProfileDetails,
    getUserInfo,
    logout,
    verifyEmail
} from "../controllers/commons/common.js"

import { isCookieAuthorized } from "../middleware/authMiddleware.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { updateProfileSchema, resetPasswordSchema } from "../validation/schema.js";

const router = express.Router();

/**
 * @description Common routes for user operations
 * @basePath /api/v1/common
 */

/**
 * @route GET /profile
 * @description Get user profile details
 * @access All authenticated users
 */
router.route('/profile').get(isCookieAuthorized, getProfileDetails);

/**
 * @route POST /updatedetails
 * @description Update user profile information
 * @access All authenticated users
 */
router.route('/updatedetails').post(isCookieAuthorized, validateSchema(updateProfileSchema), updateMyProfileDetails);

/**
 * @route POST /resetpassword
 * @description Reset user password
 * @access All authenticated users
 */
router.route('/resetpassword').post(isCookieAuthorized, validateSchema(resetPasswordSchema), resetPassword);

/**
 * @route GET /logout
 * @description Logout user and clear session
 * @access All authenticated users
 */
router.route('/logout').get(logout);

/**
 * @route GET /getme
 * @description Get decoded user information from token
 * @access All authenticated users
 */
router.route('/getme').get(isCookieAuthorized, getUserInfo);

/**
 * @route GET /verifyemail
 * @description Verify user email address
 * @access Public
 */
router.route('/verifyemail').get(verifyEmail);

export default router