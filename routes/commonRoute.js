
import express from "express";
const router = express.Router();

import { getAllBooks, getAvailableBooks, getBooksWithDuplication, getBooksForMember, editProfileDetails, resetPassword, getProfile } from "../controllers/commons/common.js"

import { getUserInfo } from "../controllers/auth/getUserinfo.js";


import { isAuthorized } from "../lib/authMiddleware.js";

router.route('/getallbooks').get(getAllBooks)
router.route('/getavailablebooks').get(getAvailableBooks)
router.route('/getbookswithduplicates').get(getBooksWithDuplication)
router.route('/getbooksformember').post(getBooksForMember)
router.route('/updatedetails').post(editProfileDetails);
router.route('/resetpassword').post(resetPassword);
router.route('/profile').post(getProfile);


router.route('/getme').get(getUserInfo)

export default router