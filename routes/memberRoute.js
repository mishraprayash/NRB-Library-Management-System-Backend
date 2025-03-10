import { Router } from "express";

const router = Router();

import { login } from "../controllers/auth/member-auth.js"
import { getDashboardDetails, getPastBorrowedBooks } from "../controllers/members/member.js"


router.route('/login').post(login)
router.route('/details').post(getDashboardDetails);
router.route('/history').post(getPastBorrowedBooks)


export default router;