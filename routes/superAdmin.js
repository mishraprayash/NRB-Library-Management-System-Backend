import { Router } from "express";
import { register, login } from "../controllers/auth/superadmin-auth.js"
import { deleteBookByCount, deleteSameMultipleBook } from "../controllers/books/book.js"

const router = Router();

router.route('/register').post(register)
router.route('/login').post(login);
router.route('/deleteallbook').post(deleteSameMultipleBook);
router.route('/deletebook').post(deleteBookByCount);

export default router