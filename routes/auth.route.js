import { Router } from "express";
import { login, registerAdmin, registerSuperAdmin } from "../controllers/auth.controller.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { userLoginSchema, userRegisterSchema } from "../validation/schema.js";

const router = Router();

/**
 * @description Authentication routes
 * @basePath /api/v1/auth
 */

router.route('/login').post(validateSchema(userLoginSchema), login);
router.route('/admin/register').post(validateSchema(userRegisterSchema), registerAdmin);
router.route('/superadmin/register').post(validateSchema(userRegisterSchema), registerSuperAdmin);

export default router

