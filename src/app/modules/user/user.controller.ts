import { RequestHandler } from "express";
import catchAsync from "../../../utils/catchAsync";
import { UserServices } from "./user.service";
import config from "../../config";
import sendResponse from "../../../utils/sendResponse";
import httpStatus from 'http-status';

const signUpUserByEmailandPassword: RequestHandler = catchAsync(async (req, res) => {
    const { refreshToken, accessToken, user } = await UserServices.SignUp(req.body);

    res.cookie('refreshToken', refreshToken, {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User is created in successfully',
        data: { accessToken, user },
    });
})
const LoginUserByEmailandPassword: RequestHandler = catchAsync(async (req, res) => {
    const { user, accessToken, refreshToken } = await UserServices.login(req.body);

    res.cookie('refreshToken', refreshToken, {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User Logged in successfully',
        data: { accessToken, user },
    });
})
const LoginwithGoogle: RequestHandler = catchAsync(async (req, res) => {
    const { user, accessToken, refreshToken } = await UserServices.googleAuth(req.body?.tokenId);

    res.cookie('refreshToken', refreshToken, {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User Logged in successfully',
        data: { accessToken, user },
    });
})
const changePassword = catchAsync(async (req, res) => {
    const { ...passwordData } = req.body;

    const result = await UserServices.changePassword(req.user, passwordData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password is udpated in successfully',
        data: result,
    });
});
const getAccessToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;

    const result = await UserServices.getAccessToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Access token retrieved successfully',
        data: result,
    });
});


const forgetPassword = catchAsync(async (req, res) => {
    const email = req.body?.email;
    const result = await UserServices.forgetPassword(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'OTP sent successfully',
        data: result,
    });
});
const verifyOTP = catchAsync(async (req, res) => {
    const { email, OTP } = req.body;
    const { token } = await UserServices.verifyOTP(email, OTP);

    res.cookie('verifiedUser', token, {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Change password within 30 minutes',
        data: '',
    });
});

const resetPassword = catchAsync(async (req, res) => {

    const { verifiedUser } = req.cookies;
    const newPassword = req.body?.newPassword;
    const result = await UserServices.resetPassword(verifiedUser, newPassword);

    res.clearCookie('verifiedUser', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password Reset Successfully',
        data: result,
    });
});


const createPinForSecureFolder = catchAsync(async (req, res) => {
    const PIN = req.body?.PIN;

    const result = await UserServices.createPinForSecureFolder(req.user, PIN);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Secured Root folder and PIN added successfully',
        data: result,
    });
});

const LoginToSecureFolder = catchAsync(async (req, res) => {
    const PIN = req.body?.PIN;

    const {securedrootFolderID,accessToken} = await UserServices.LoginToSecureFolder(req.user, PIN);

    
    res.cookie('secureFolderToken', accessToken, {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 10,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Secured Folder Login successfully and cookie updated',
        data: {
            securedrootFolderID
        },
    });
});

const logOutFromSecureFolder = catchAsync(async (req, res) => {
  

    res.clearCookie('secureFolderToken', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logout from secure folder Successfully',
        data: '',
    });
});
const logOut = catchAsync(async (req, res) => {
  

    res.clearCookie('secureFolderToken', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
    });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logout folder Successfully',
        data: '',
    });
});

// change name
const changeName = catchAsync(async (req, res) => {
    const userName = req.body?.userName;

    const result = await UserServices.changeNameIntoDB(req.user, userName);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Name is udpated in successfully',
        data: result,
    });
});

// get my profile
const getMyProfile = catchAsync(async (req, res) => {
 const {email} = req.user;

    const result = await UserServices.getMyProfile(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Porfile data retrieved successfully',
        data: result,
    });
});
export const UserControllers = {
    signUpUserByEmailandPassword,
    LoginUserByEmailandPassword,
    LoginwithGoogle,
    logOut,
    changePassword,
    getAccessToken,
    forgetPassword,
    verifyOTP,
    resetPassword,
    changeName,
    createPinForSecureFolder,
    LoginToSecureFolder,
    logOutFromSecureFolder,
    getMyProfile
};