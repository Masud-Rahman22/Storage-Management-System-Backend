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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = require("./user.model");
const http_status_1 = __importDefault(require("http-status"));
const storageSystem_model_1 = require("../StorageSytem/storageSystem.model");
const config_1 = __importDefault(require("../../config"));
const user_utils_1 = require("./user.utils");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendEmail_1 = require("../../../utils/sendEmail");
const utility_1 = require("../../../utils/utility");
const google_auth_library_1 = require("google-auth-library");
const UpdatePassword = (userID, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const newHashedPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_round));
    yield user_model_1.User.findOneAndUpdate({
        _id: userID,
    }, {
        password: newHashedPassword,
        needsPasswordChange: false,
        passwordChangedAt: new Date(),
    });
});
const gClient = new google_auth_library_1.OAuth2Client(config_1.default.GOOGLE_CLIENT_ID);
const googleAuth = (tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!tokenId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "credential is required");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = yield gClient
        .verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const user = yield user_model_1.User.findOne({ email: result.payload.email });
    if (user) {
        // already signed up user
        const jwtPayload = {
            email: user.email,
            rootFolder: user.rootFolderID
        };
        const accessToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_ACCESS_SECRET, config_1.default.JWT_ACCESS_EXPIRES_IN);
        const refreshToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_REFRESH_SECRET, config_1.default.JWT_REFRESH_EXPIRES_IN);
        return {
            user: {
                _id: user._id,
                email: user.email,
                userName: user.userName,
                limit: user.limit,
                rootFolderID: user.rootFolderID,
            },
            accessToken,
            refreshToken
        };
    }
    else {
        //new user
        const userData = {
            email: result.payload.email,
            userName: result.payload.given_name + result.payload.family_name,
        };
        const session = yield mongoose_1.default.startSession();
        try {
            session.startTransaction();
            // Create the user
            const user = yield user_model_1.User.create([userData], { session });
            if (!user.length) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to create user');
            }
            const RootfolderData = {
                userID: user[0]._id,
                folderName: 'My Folder',
                access: [user[0]._id],
            };
            // Create the root folder
            const newRootFolder = yield storageSystem_model_1.FolderModel.create([RootfolderData], { session });
            if (!newRootFolder.length) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to create Root folder');
            }
            //Update the user with rootFolderID
            const updateResult = yield user_model_1.User.updateOne({ _id: user[0]._id }, { rootFolderID: newRootFolder[0]._id }, { session });
            if (!updateResult.matchedCount || !updateResult.modifiedCount) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to associate root folder with user');
            }
            yield session.commitTransaction();
            // create token and sent to the client
            const jwtPayload = {
                email: user[0].email,
                rootFolder: newRootFolder[0]._id
            };
            const accessToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_ACCESS_SECRET, config_1.default.JWT_ACCESS_EXPIRES_IN);
            const refreshToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_REFRESH_SECRET, config_1.default.JWT_REFRESH_EXPIRES_IN);
            return {
                user: {
                    _id: user[0]._id,
                    email: user[0].email,
                    userName: user[0].userName,
                    limit: user[0].limit,
                    rootFolderID: newRootFolder[0]._id,
                },
                accessToken,
                refreshToken
            };
        }
        catch (error) {
            yield session.abortTransaction();
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, error.message || 'An unknown error occurred', error === null || error === void 0 ? void 0 : error.stack);
        }
        finally {
            yield session.endSession();
        }
    }
});
const SignUp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield user_model_1.User.isUserExistsByEmail(payload.email);
    if (isUserExist) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'User Already exists');
    }
    const userData = {
        email: payload.email,
        userName: payload.userName,
        password: payload.password,
    };
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Create the user
        const user = yield user_model_1.User.create([userData], { session });
        if (!user.length) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to create user');
        }
        const RootfolderData = {
            userID: user[0]._id,
            folderName: 'My Folder',
            access: [user[0]._id],
        };
        // Create the root folder
        const newRootFolder = yield storageSystem_model_1.FolderModel.create([RootfolderData], { session });
        if (!newRootFolder.length) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to create Root folder');
        }
        //Update the user with rootFolderID
        const updateResult = yield user_model_1.User.updateOne({ _id: user[0]._id }, { rootFolderID: newRootFolder[0]._id }, { session });
        if (!updateResult.matchedCount || !updateResult.modifiedCount) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to associate root folder with user');
        }
        yield session.commitTransaction();
        // create token and sent to the client
        const jwtPayload = {
            email: user[0].email,
            rootFolder: newRootFolder[0]._id
        };
        const accessToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_ACCESS_SECRET, config_1.default.JWT_ACCESS_EXPIRES_IN);
        const refreshToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_REFRESH_SECRET, config_1.default.JWT_REFRESH_EXPIRES_IN);
        return {
            user: {
                _id: user[0]._id,
                email: user[0].email,
                userName: user[0].userName,
                limit: user[0].limit,
                rootFolderID: newRootFolder[0]._id,
            },
            accessToken,
            refreshToken
        };
    }
    catch (error) {
        yield session.abortTransaction();
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, error.message || 'An unknown error occurred', error === null || error === void 0 ? void 0 : error.stack);
    }
    finally {
        yield session.endSession();
    }
});
const login = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // check if the userExist
    const user = yield user_model_1.User.isUserExistsByEmail(payload.email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    //checking if the password is correct
    if ((user === null || user === void 0 ? void 0 : user.password) && !(yield user_model_1.User.isPasswordMatched(payload.password, user.password))) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Password is not correct');
    }
    const jwtPayload = {
        email: user.email,
        rootFolder: user.rootFolderID
    };
    const accessToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_ACCESS_SECRET, config_1.default.JWT_ACCESS_EXPIRES_IN);
    const refreshToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_REFRESH_SECRET, config_1.default.JWT_REFRESH_EXPIRES_IN);
    return {
        user: {
            _id: user._id,
            email: user.email,
            userName: user.userName,
            limit: user.limit,
            rootFolderID: user.rootFolderID,
        },
        accessToken,
        refreshToken
    };
});
const changePassword = (userData, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // check if the userExist
    const user = yield user_model_1.User.isUserExistsByEmail(userData.email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    //checking if the old password is correcttly matched with db password
    if (user.password && !(yield user_model_1.User.isPasswordMatched(payload.oldPassword, user === null || user === void 0 ? void 0 : user.password))) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'old Password is not correct');
    }
    yield UpdatePassword(user._id, payload.newPassword);
    return null;
});
const getAccessToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthrized access');
    }
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_REFRESH_SECRET);
    const { email, iat } = decoded;
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    //check if the token is generated before the  password has changed
    if ((user === null || user === void 0 ? void 0 : user.passwordChangedAt) &&
        user_model_1.User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat)) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized. Log in Again');
    }
    const jwtPayload = {
        email: user.email,
        rootFolder: user.rootFolderID
    };
    const accessToken = (0, user_utils_1.createToken)(jwtPayload, config_1.default.JWT_ACCESS_SECRET, config_1.default.JWT_ACCESS_EXPIRES_IN);
    return {
        accessToken,
    };
});
const forgetPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    const currentTime = new Date();
    const OTPExpiresAt = (_a = user.verificationInfo) === null || _a === void 0 ? void 0 : _a.OTPExpiresAt;
    if (OTPExpiresAt && currentTime < OTPExpiresAt) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'OTP already generated recently');
    }
    const OTP = (0, utility_1.generateOTP)(6);
    const newOTPExpiresAt = new Date();
    newOTPExpiresAt.setMinutes(newOTPExpiresAt.getMinutes() + 5);
    const updatedUser = yield user_model_1.User.updateOne({ email: user.email }, {
        $set: {
            'verificationInfo.OTP': OTP,
            'verificationInfo.OTPExpiresAt': newOTPExpiresAt,
            'verificationInfo.OTPUsed': false,
        },
    });
    if (updatedUser.modifiedCount === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to update OTP');
    }
    //send otp to the email of the user
    const OTPmail = `Your OTP for changing password is ${OTP}. Please verify in 5 minutes`;
    yield (0, sendEmail_1.sendEmail)(user.email, OTPmail);
    return null;
});
const verifyOTP = (email, OTP) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    if (!user_model_1.User.isOTPVerified(OTP, (_a = user === null || user === void 0 ? void 0 : user.verificationInfo) === null || _a === void 0 ? void 0 : _a.OTP, (_b = user === null || user === void 0 ? void 0 : user.verificationInfo) === null || _b === void 0 ? void 0 : _b.OTPExpiresAt, (_c = user === null || user === void 0 ? void 0 : user.verificationInfo) === null || _c === void 0 ? void 0 : _c.OTPUsed)) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'OTP verification failed');
    }
    const jwtPayload = {
        email: user.email
    };
    const token = (0, user_utils_1.createVerifyUserToken)(jwtPayload, config_1.default.JWT_VERIFIED_USER_SECRET, '60m');
    return {
        token,
    };
});
const resetPassword = (token, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthrized');
    }
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_VERIFIED_USER_SECRET);
    const { email } = decoded;
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    yield UpdatePassword(user._id, password);
    const updateResult = yield user_model_1.User.updateOne({ _id: user._id }, {
        $unset: { verificationInfo: 1 },
    });
    if (!updateResult.matchedCount || !updateResult.modifiedCount) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to remove verification information');
    }
    return null;
});
const createPinForSecureFolder = (userData, PIN) => __awaiter(void 0, void 0, void 0, function* () {
    // check if the userExist
    const user = yield user_model_1.User.isUserExistsByEmail(userData.email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    if (user.secureFolderPin || user.securedrootFolderID) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'Pin and folder Already Created');
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const securefolderData = {
            userID: user._id,
            folderName: 'Secured Folder',
            access: [user._id],
            isSecured: true
        };
        // Create the secured root folder
        const securedRootFolder = yield storageSystem_model_1.FolderModel.create([securefolderData], { session });
        if (!securedRootFolder.length) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to create secured Root folder');
        }
        const HashedPin = yield bcrypt_1.default.hash(PIN, Number(config_1.default.bcrypt_salt_round));
        //Update the user with rootFolderID
        const updateResult = yield user_model_1.User.updateOne({ _id: user._id }, {
            securedrootFolderID: securedRootFolder[0]._id,
            secureFolderPin: HashedPin
        }, { session });
        if (!updateResult.matchedCount || !updateResult.modifiedCount) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to associate root folder with user');
        }
        yield session.commitTransaction();
        return null;
    }
    catch (error) {
        yield session.abortTransaction();
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, error.message || 'An unknown error occurred', error === null || error === void 0 ? void 0 : error.stack);
    }
    finally {
        yield session.endSession();
    }
});
const LoginToSecureFolder = (userData, PIN) => __awaiter(void 0, void 0, void 0, function* () {
    // check if the userExist
    const user = yield user_model_1.User.isUserExistsByEmail(userData.email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from system');
    }
    if (!user.secureFolderPin || !user.securedrootFolderID) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Pin and secure folder are not created');
    }
    //checking if the password is correct
    if ((user === null || user === void 0 ? void 0 : user.password) && !(yield user_model_1.User.isPasswordMatched(PIN, user.secureFolderPin))) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Password is not correct');
    }
    const jwtPayload = {
        email: user.email,
        securedrootFolderID: user.securedrootFolderID
    };
    const accessToken = (0, user_utils_1.createSecuredFolderToken)(jwtPayload, config_1.default.JWT_ACCESS_SECRET, config_1.default.JWT_ACCESS_EXPIRES_IN);
    return {
        securedrootFolderID: user.securedrootFolderID,
        accessToken,
    };
});
const changeNameIntoDB = (userData, name) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOneAndUpdate({
        email: userData.email,
    }, {
        userName: name,
    }, {
        new: true
    });
    return user;
});
const getMyProfile = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    const sizesByType = yield storageSystem_model_1.FileModel.aggregate([
        { $match: { userID: user._id } },
        {
            $group: {
                _id: '$dataType',
                totalSize: { $sum: '$fileSize' },
            },
        },
    ]);
    let totalUsedFromLimit = 0;
    const storageUsageByType = sizesByType.reduce((acc, { _id, totalSize }) => {
        acc[_id] = totalSize;
        totalUsedFromLimit += totalSize;
        return acc;
    }, {});
    const remainingStorage = user.limit - totalUsedFromLimit;
    const recentFolders = yield storageSystem_model_1.FolderModel.find({ userID: user._id, isSecured: false }).sort({ updatedAt: -1 }).limit(8);
    const recentFiles = yield storageSystem_model_1.FileModel.find({ userID: user._id, isSecured: false }).sort({ updatedAt: -1 }).limit(8);
    const combinedResults = [...recentFolders, ...recentFiles];
    const sortedResults = combinedResults.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    const recent = sortedResults.slice(0, 8);
    return {
        user,
        storageUsageByType,
        remainingStorage,
        recent
    };
});
exports.UserServices = {
    SignUp,
    login,
    googleAuth,
    changePassword,
    getAccessToken,
    forgetPassword,
    verifyOTP,
    resetPassword,
    changeNameIntoDB,
    createPinForSecureFolder,
    LoginToSecureFolder,
    getMyProfile
};
