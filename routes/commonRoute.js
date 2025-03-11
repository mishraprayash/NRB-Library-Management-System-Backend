
import express from "express";

import {
    getAllBooks,
    getAvailableBooks,
    getBooksWithDuplication,
    getBorrowedBooksForMember,
    updateMyProfileDetails,
    resetPassword,
    getProfileDetails,
    getUserInfo,
    logout
} from "../controllers/commons/common.js"

import { isCookieAuthorized } from "../lib/authMiddleware.js";


const router = express.Router();

/*
These are the routes related to the book which can be accessed by all the user types if they are authentcated
*/

router.route('/getallbooks').get(isCookieAuthorized, getAllBooks)
router.route('/getavailablebooks').get(isCookieAuthorized, getAvailableBooks)
router.route('/getbookswithduplicates').get(isCookieAuthorized, getBooksWithDuplication)
router.route('/getbooksformember').post(isCookieAuthorized, getBorrowedBooksForMember)


/* 
These routes are for getting profile details, editing them and reseting password and they can be accessed by all the users.
*/

router.route('/profile').get(isCookieAuthorized, getProfileDetails);
router.route('/updatedetails').post(isCookieAuthorized, updateMyProfileDetails);
router.route('/resetpassword').post(isCookieAuthorized, resetPassword);

// route for logging out the user, works for all the user.
router.route('/logout').get(isCookieAuthorized, logout);

// route for decoding token and sending plain text values
router.route('/getme').get(isCookieAuthorized, getUserInfo)


export default router