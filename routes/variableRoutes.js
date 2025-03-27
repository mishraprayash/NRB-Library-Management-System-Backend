
import { Router } from "express";
import { getVariables, createVariables, updateVariables } from "../controllers/variables/variable.js";
import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../lib/authMiddleware.js";


const router = Router();

/*  
These routes for updating/creating the variables is only accessible to the superadmin.
*/

// getvariables can be accessed by both superadmin and admin
router.route('/').get(isCookieAuthorized, getVariables)

router.route('/create').post(isCookieAuthorized, super_admin_only, createVariables);
router.route('/update').post(isCookieAuthorized, super_admin_only, updateVariables);


export default router