import { Router } from "express";

export const router = Router();

import { getDashboardDetails, getPastBorrowedBooks } from "../controllers/members/member.js"

import { isCookieAuthorized, super_admin_only, admin_superAdmin_both } from "../lib/authMiddleware.js";

import { getMembers, addMember, editMemberDetails, deleteMember } from "../controllers/members/member.js";


/* 
The prefix route for this file is api/v1/member
*/

/* SuperAdmin and Admin only*/
router.route('/getall').get(isCookieAuthorized, admin_superAdmin_both, getMembers);
router.route('/add').post(isCookieAuthorized, admin_superAdmin_both, addMember);
router.route('/edit').post(isCookieAuthorized, admin_superAdmin_both, editMemberDetails)

// this route is for fetching dashboard information related to member.
router.route('/dashboard').get(isCookieAuthorized, getDashboardDetails);

// this is for fetching past issued books related to that member.
router.route('/history').get(isCookieAuthorized, getPastBorrowedBooks)


/* Super Admin Only*/
router.route('/delete').post(isCookieAuthorized, super_admin_only, deleteMember)


export default router;