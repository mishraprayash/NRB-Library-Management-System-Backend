import { Router } from "express";
import { 
    isCookieAuthorized, 
    super_admin_only, 
    admin_superAdmin_both, 
    member_only 
} from "../middleware/authMiddleware.js";

import { 
    getMembers, 
    addMember, 
    editMemberDetails, 
    deleteMember, 
    getAllAdmins, 
    activateMember, 
    deactivateMember 
} from "../controllers/member.controller.js";

import { userRegisterSchema, getBorrowedBooksSchema, userEditSchema } from "../validation/schema.js";
import { getDashboardDetails, getPastBorrowedBooks } from "../controllers/member.controller.js"
import { validateSchema } from "../middleware/validateSchema.js";

/**
 * @description Member management routes
 * @basePath /api/v1/member
 */

const router = Router();

router.route('/getall').get(isCookieAuthorized, admin_superAdmin_both, getMembers);
router.route('/dashboard').get(isCookieAuthorized, member_only, getDashboardDetails);
router.route('/history').get(isCookieAuthorized, getPastBorrowedBooks);
router.route('/delete').post(isCookieAuthorized, super_admin_only, deleteMember);
router.route('/add').post(isCookieAuthorized, admin_superAdmin_both, validateSchema(userRegisterSchema), addMember);
router.route('/edit').post(isCookieAuthorized, admin_superAdmin_both, validateSchema(userEditSchema), editMemberDetails);
router.route('/admins').get(isCookieAuthorized, admin_superAdmin_both, getAllAdmins)
router.route('/activate').post(isCookieAuthorized, super_admin_only, activateMember)
router.route('/deactivate').post(isCookieAuthorized, super_admin_only, deactivateMember)


export default router;