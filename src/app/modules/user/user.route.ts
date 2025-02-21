import express from 'express';
import { UserValidation } from './user.validation';
import { UserControllers } from './user.controller';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
const router = express.Router();
router.post(
    '/sign-up',
    validateRequest(UserValidation.SignUpByEmailAndPasswordValidationSchema),
    UserControllers.signUpUserByEmailandPassword
);
router.post(
    '/log-in',
    validateRequest(UserValidation.loginValidationSchema),
    UserControllers.LoginUserByEmailandPassword
);

router.get(
    '/log-out',
    auth(),
    UserControllers.logOut,
);
router.post(
    '/log-in-with-google',
    validateRequest(UserValidation.loginWithGoogleValidationSchema),
    UserControllers.LoginwithGoogle
);
router.post(
    '/change-password',
    auth(),
    validateRequest(UserValidation.ChangePasswordValidationSchema),
    UserControllers.changePassword,
);
router.get(
    '/refresh-token',
    validateRequest(UserValidation.getAccessTokenByRefreshTokenValidationSchema),
    UserControllers.getAccessToken,
);
router.post(
    '/forget-password',
    validateRequest(UserValidation.forgetPasswordValidationSchema),
    UserControllers.forgetPassword,
);

router.post(
    '/verify-OTP',
    validateRequest(UserValidation.verifyOTPValidationSchema),
    UserControllers.verifyOTP,
);
router.post(
    '/reset-password',
    validateRequest(UserValidation.resetPasswordValidationSchema),
    UserControllers.resetPassword,
);


router.post(
    '/create-PIN',
    auth(),
    validateRequest(UserValidation.PinValidationSchema),
    UserControllers.createPinForSecureFolder,
);
router.post(
    '/log-in-to-secure-folder',
    auth(),
    validateRequest(UserValidation.PinValidationSchema),
    UserControllers.LoginToSecureFolder,
);

router.get(
    '/log-out-from-secure-folder',
    auth(),
    UserControllers.logOutFromSecureFolder,
);
router.patch(
    '/change-name',
    auth(),
    validateRequest(UserValidation.ChangeNameValidationSchema),
    UserControllers.changeName,
);
router.get(
    '/get-my-profile',
    auth(),
    UserControllers.getMyProfile,
);


export const UserRouter = router;