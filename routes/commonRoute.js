
import express from "express";
const router = express.Router();

import {getBooks, getAvailableBooks, logout, getBooksWithDuplication} from "../controllers/common.js"

router.route('/getallbooks').get(getBooks)
router.route('/getavailablebooks').get(getAvailableBooks)
router.route('/logout').get(logout)
router.route('/getbookswithduplicates').get(getBooksWithDuplication)

export default router