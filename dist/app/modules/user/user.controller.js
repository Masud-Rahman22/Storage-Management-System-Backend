"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const user_service_1 = require("./user.service");
const config_1 = __importDefault(require("../../config"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const signUpUserByEmailandPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken, accessToken, user } = yield user_service_1.UserServices.SignUp(req.body);
    res.cookie('refreshToken', refreshToken, {
        secure: config_1.default.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User is created in successfully',
        data: { accessToken, user },
    });
}));
const LoginUserByEmailandPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, accessToken, refreshToken } = yield user_service_1.UserServices.login(req.body);
    res.cookie('refreshToken', refreshToken, {
        secure: config_1.default.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User Logged in successfully',
        data: { accessToken, user },
    });
}));
const LoginwithGoogle = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { user, accessToken, refreshToken } = yield user_service_1.UserServices.googleAuth((_a = req.body) === null || _a === void 0 ? void 0 : _a.tokenId);
    res.cookie('refreshToken', refreshToken, {
        secure: config_1.default.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User Logged in successfully',
        data: { accessToken, user },
    });
}));
const changePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const passwordData = __rest(req.body, []);
    const result = yield user_service_1.UserServices.changePassword(req.user, passwordData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Password is udpated in successfully',
        data: result,
    });
}));
const getAccessToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.cookies;
    const result = yield user_service_1.UserServices.getAccessToken(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Access token retrieved successfully',
        data: result,
    });
}));
const forgetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (_a = req.body) === null || _a === void 0 ? void 0 : _a.email;
    const result = yield user_service_1.UserServices.forgetPassword(email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'OTP sent successfully',
        data: result,
    });
}));
const verifyOTP = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, OTP } = req.body;
    const { token } = yield user_service_1.UserServices.verifyOTP(email, OTP);
    res.cookie('verifiedUser', token, {
        secure: config_1.default.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Change password within 30 minutes',
        data: '',
    });
}));
const resetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { verifiedUser } = req.cookies;
    const newPassword = (_a = req.body) === null || _a === void 0 ? void 0 : _a.newPassword;
    const result = yield user_service_1.UserServices.resetPassword(verifiedUser, newPassword);
    res.clearCookie('verifiedUser', {
        httpOnly: true,
        secure: config_1.default.NODE_ENV === 'production',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Password Reset Successfully',
        data: result,
    });
}));
const createPinForSecureFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const PIN = (_a = req.body) === null || _a === void 0 ? void 0 : _a.PIN;
    const result = yield user_service_1.UserServices.createPinForSecureFolder(req.user, PIN);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Secured Root folder and PIN added successfully',
        data: result,
    });
}));
const LoginToSecureFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const PIN = (_a = req.body) === null || _a === void 0 ? void 0 : _a.PIN;
    const { securedrootFolderID, accessToken } = yield user_service_1.UserServices.LoginToSecureFolder(req.user, PIN);
    res.cookie('secureFolderToken', accessToken, {
        secure: config_1.default.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 10,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Secured Folder Login successfully and cookie updated',
        data: {
            securedrootFolderID
        },
    });
}));
const logOutFromSecureFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('secureFolderToken', {
        httpOnly: true,
        secure: config_1.default.NODE_ENV === 'production',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Logout from secure folder Successfully',
        data: '',
    });
}));
const logOut = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('secureFolderToken', {
        httpOnly: true,
        secure: config_1.default.NODE_ENV === 'production',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config_1.default.NODE_ENV === 'production',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Logout folder Successfully',
        data: '',
    });
}));
// change name
const changeName = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userName = (_a = req.body) === null || _a === void 0 ? void 0 : _a.userName;
    const result = yield user_service_1.UserServices.changeNameIntoDB(req.user, userName);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Name is udpated in successfully',
        data: result,
    });
}));
// get my profile
const getMyProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.user;
    const result = yield user_service_1.UserServices.getMyProfile(email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Porfile data retrieved successfully',
        data: result,
    });
}));
exports.UserControllers = {
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
