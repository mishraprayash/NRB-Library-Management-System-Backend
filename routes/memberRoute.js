import { Router } from "express";

export const router = Router();

import { getDashboardDetails, getPastBorrowedBooks } from "../controllers/members/member.js"

import { isCookieAuthorized, super_admin_only, admin_superAdmin_both, member_only } from "../middleware/authMiddleware.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { userRegisterSchema, getBorrowedBooksSchema } from "../validation/schema.js";

import { getMembers, addMember, editMemberDetails, deleteMember } from "../controllers/members/member.js";

/**
 * @description Member management routes
 * @basePath /api/v1/member
 */

/**
 * @route GET /getall
 * @description Get all members
 * @access Admin and SuperAdmin
 */
router.route('/getall').get(isCookieAuthorized, admin_superAdmin_both, getMembers);

/**
 * @route POST /add
 * @description Add a new member
 * @access Admin and SuperAdmin
 */
router.route('/add').post(isCookieAuthorized, admin_superAdmin_both, validateSchema(userRegisterSchema), addMember);

/**
 * @route POST /edit
 * @description Edit member details
 * @access Admin and SuperAdmin
 */
router.route('/edit').post(isCookieAuthorized, admin_superAdmin_both, validateSchema(userRegisterSchema), editMemberDetails);

/**
 * @route GET /dashboard
 * @description Get member dashboard information
 * @access Member only
 */
router.route('/dashboard').get(isCookieAuthorized, member_only, getDashboardDetails);

/**
 * @route GET /history
 * @description Get member's borrowing history
 * @access All authenticated users
 */
router.route('/history').get(isCookieAuthorized, getPastBorrowedBooks);

/**
 * @route POST /delete
 * @description Delete a member
 * @access SuperAdmin only
 */
router.route('/delete').post(isCookieAuthorized, super_admin_only, deleteMember);

export default router;