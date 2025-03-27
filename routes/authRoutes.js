
import { Router } from "express";

import { login, registerAdmin, registerSuperAdmin } from "../controllers/auth/auth.js";

const router = Router()

router.route('/login').post(login)
router.route('/admin/register').post(registerAdmin)
router.route('/superadmin/register').post(registerSuperAdmin)


export default router

