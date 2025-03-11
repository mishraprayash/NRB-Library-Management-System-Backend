import express from "express";

// admin auth
import {
    register,
    login
} from "../controllers/auth/admin-auth.js";

// 
import {
    getMembers,
    addMember,
    deleteMember,
    editMemberDetails
} from "../controllers/members/member.js"

import {
    getVariables,
    createVariables,
    updateVariables
} from "../controllers/variables/variable.js"

import {
    addBook,
    editBook,
    returnBook,
    renewBook,
    getAllBorrowedBooks,
    borrowBook,
    getDashBoardInfo
} from "../controllers/books/book.js"


import { isCookieAuthorized, admin_superAdmin_both, super_admin_only } from "../lib/authMiddleware.js"

const router = express.Router();


// auth routes
router.route('/register').post(register);
router.route('/login').post(login);


// books 
router.route('/addbook').post(isCookieAuthorized, admin_superAdmin_both, addBook);
router.route('/editbook').post(editBook);


router.route('/borrowbook').post(isCookieAuthorized, admin_superAdmin_both, borrowBook);
router.route('/returnbook').post(isCookieAuthorized, admin_superAdmin_both, returnBook);
router.route('/renewbook').post(isCookieAuthorized, admin_superAdmin_both, renewBook)
router.route('/getallborrowedbooks').get(isCookieAuthorized, admin_superAdmin_both, getAllBorrowedBooks)


// members
router.route('/getmembers').get(isCookieAuthorized, admin_superAdmin_both, getMembers);
router.route('/addmember').post(isCookieAuthorized, admin_superAdmin_both, addMember);
router.route('/editmember').post(isCookieAuthorized, admin_superAdmin_both, editMemberDetails)

// this route can only be accessed by the superadmin
router.route('/deletemember').post(isCookieAuthorized, super_admin_only, deleteMember)



/*  
These routes for updating/creating the variables is only accessible to the superadmin.
*/

// getvariables can be accessed by both superadmin and admin
router.route('/getvariables').get(isCookieAuthorized, admin_superAdmin_both, getVariables)

router.route('/createvariables').post(isCookieAuthorized, super_admin_only, createVariables);
router.route('/updatevariables').post(isCookieAuthorized, super_admin_only, updateVariables);


// fetches information for dashboard for both admin and superadmin
router.route('/details').get(isCookieAuthorized, admin_superAdmin_both, getDashBoardInfo)



export default router;

