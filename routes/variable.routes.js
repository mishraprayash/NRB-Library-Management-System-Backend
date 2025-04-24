import { Router } from "express";
import { getVariables, createVariables, updateVariables, removeCategory } from "../controllers/variable.controller.js";
import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../middleware/authMiddleware.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { variablesCreateSchema, variablesUpdateSchema } from "../validation/schema.js";

/**
 * @description System variables management routes
 * @basePath /api/v1/variables
*/

const router = Router();

router.route('/').get(isCookieAuthorized, getVariables);
router.route('/create').post(isCookieAuthorized, super_admin_only, validateSchema(variablesCreateSchema), createVariables);
router.route('/update').post(isCookieAuthorized, super_admin_only, validateSchema(variablesUpdateSchema), updateVariables);
router.route('/deletecategory').post(isCookieAuthorized, super_admin_only, removeCategory);

export default router