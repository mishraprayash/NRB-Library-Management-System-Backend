
import express from "express";
const router = express.Router();

import {getBooks, getAvailableBooks, logout, getBooksWithDuplication} 
from "../controllers/commons/common.js"

import { getSingleMember } from "../controllers/members/member.js";

router.route('/getallbooks').get(getBooks)
router.route('/getavailablebooks').get(getAvailableBooks)
router.route('/getbookswithduplicates').get(getBooksWithDuplication)

router.route('/getsinglemember').post(getSingleMember)

router.route('/logout').get(logout)

export default router