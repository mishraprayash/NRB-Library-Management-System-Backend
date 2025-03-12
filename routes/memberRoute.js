import { Router } from "express";

export const router = Router();

import { getDashboardDetails, getPastBorrowedBooks } from "../controllers/members/member.js"

import { isCookieAuthorized, super_admin_only, admin_superAdmin_both } from "../lib/authMiddleware.js";

import { getMembers, addMember, editMemberDetails, deleteMember } from "../controllers/members/member.js";

// members
router.route('/getall').get(isCookieAuthorized, admin_superAdmin_both, getMembers);
router.route('/add').post(isCookieAuthorized, admin_superAdmin_both, addMember);
router.route('/edit').post(isCookieAuthorized, admin_superAdmin_both, editMemberDetails)

router.route('/dashboard').post(isCookieAuthorized, admin_superAdmin_both, getDashboardDetails);
router.route('/history').post(isCookieAuthorized, admin_superAdmin_both, getPastBorrowedBooks)

// this route can only be accessed by the superadmin
router.route('/delete').post(isCookieAuthorized, super_admin_only, deleteMember)


export default router;