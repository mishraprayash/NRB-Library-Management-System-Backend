import { Router } from 'express';
import {
  updateMyProfileDetails,
  resetPassword,
  getProfileDetails,
  logout,
  verifyEmail,
  sendVerifyEmail,
  changePassword,
  sendForgotPasswordLink,
  checkIsEmailVerified,
} from '../controllers/common.controller.js';

import { isCookieAuthorized } from '../middleware/authMiddleware.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { updateProfileSchema, resetPasswordSchema } from '../validation/schema.js';

/**
 * @description Common routes for user operations
 * @basePath /api/v1/common
 */

const router = Router();

router.route('/profile').get(isCookieAuthorized, getProfileDetails);
router
  .route('/updatedetails')
  .post(isCookieAuthorized, validateSchema(updateProfileSchema), updateMyProfileDetails);
router
  .route('/changepassword')
  .post(isCookieAuthorized, validateSchema(resetPasswordSchema), changePassword);
router.route('/logout').get(logout);
router.route('/verifyemail').get(verifyEmail);
router.route('/sendverificationemail').get(isCookieAuthorized, sendVerifyEmail);
router.route('/sendpasswordresetlink').post(sendForgotPasswordLink);
router.route('/resetpassword').post(resetPassword);
router.route('/checkemail').get(isCookieAuthorized, checkIsEmailVerified);

export default router;
