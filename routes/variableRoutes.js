
import { Router } from "express";
import { getVariables, createVariables, updateVariables } from "../controllers/variables/variable.js";
import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../lib/authMiddleware.js";


const router = Router();

/*  
These routes for updating/creating the variables is only accessible to the superadmin.
*/

// getvariables can be accessed by both superadmin and admin
router.route('/getvariables').get(isCookieAuthorized, admin_superAdmin_both, getVariables)

router.route('/createvariables').post(isCookieAuthorized, super_admin_only, createVariables);
router.route('/updatevariables').post(isCookieAuthorized, super_admin_only, updateVariables);


export default router