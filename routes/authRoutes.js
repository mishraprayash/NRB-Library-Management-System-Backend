
import { Router } from "express";

import { login, registerAdmin, registerSuperAdmin } from "../controllers/auth/auth.js";

const router = Router()

router.route('/login').post(login)
router.route('/admin/register').post(registerAdmin)
router.route('/sadmin/register').post(registerSuperAdmin)


export default router

