import express from "express";

// admin auth
import { register, login } from "../controllers/auth/admin/auth.js";

// 
import { getMembers, addMember, deleteMember, getSingleMember, editMember } from "../controllers/members/member.js"

import { getVariables, createVariables, updateVariables } from "../controllers/variables/variable.js"

import { addBook, editBook, deleteBook, returnBook, renewBook, getAllBorrowedBooks, borrowBook } from "../controllers/books/book.js"


import { isAuthorized, isCookieAuthorized } from "../lib/authMiddleware.js"


const router = express.Router();


// authentication 
router.route('/register').post(register);
router.route('/login').post(login);


// books 
router.route('/addbook').post(addBook);
router.route('/editbook').post(editBook);
router.route('/deletebooks').post(deleteBook);

router.route('/borrowbook').post(borrowBook);
router.route('/returnbook').post(returnBook);
router.route('/renewbook').post(renewBook)
router.route('/getallborrowedbooks').get(getAllBorrowedBooks)


// members
router.route('/getmembers').get(getMembers);
router.route('/getsinglemember').post(getSingleMember);
router.route('/addmember').post(addMember);
router.route('/editmember').post(editMember)
router.route('/deletemember').post(deleteMember)


// variables
router.route('/createvariables').post(createVariables);
router.route('/updatevariables').post(updateVariables);
router.route('/getvariables').get(getVariables)



export default router;

