import { Router } from "express";
import { getVariables, createVariables, updateVariables } from "../controllers/variables/variable.js";
import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../middleware/authMiddleware.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { variablesCreateSchema, variablesUpdateSchema } from "../validation/schema.js";

const router = Router();

/**
 * @description System variables management routes
 * @basePath /api/v1/variables
 */

/**
 * @route GET /
 * @description Get current system variables
 * @access Admin and SuperAdmin
 */
router.route('/').get(isCookieAuthorized, getVariables);

/**
 * @route POST /create
 * @description Create initial system variables
 * @access SuperAdmin only
 */
router.route('/create').post(isCookieAuthorized, super_admin_only, validateSchema(variablesCreateSchema), createVariables);

/**
 * @route POST /update
 * @description Update system variables
 * @access SuperAdmin only
 */
router.route('/update').post(isCookieAuthorized, super_admin_only, validateSchema(variablesUpdateSchema), updateVariables);

export default router