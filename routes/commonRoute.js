
import express from "express";

import {
    updateMyProfileDetails,
    resetPassword,
    getProfileDetails,
    getUserInfo,
    logout
} from "../controllers/commons/common.js"


import { isCookieAuthorized } from "../lib/authMiddleware.js";


const router = express.Router();

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