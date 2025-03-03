
import express from "express";
const router = express.Router();

import { getAllBooks, getAvailableBooks, logout, getBooksWithDuplication, getBooksForMember }from "../controllers/commons/common.js"

import { getSingleMember, } from "../controllers/members/member.js";

router.route('/getallbooks').get(getAllBooks)
router.route('/getavailablebooks').get(getAvailableBooks)
router.route('/getbookswithduplicates').get(getBooksWithDuplication)
router.route('/getbooksformember').post(getBooksForMember)

router.route('/getsinglemember').post(getSingleMember)

router.route('/logout').get(logout)

export default router