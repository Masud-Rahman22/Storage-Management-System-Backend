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
exports.isAllowed = exports.auth = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../app/errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../app/config"));
const user_model_1 = require("../app/modules/user/user.model");
const storageSystem_model_1 = require("../app/modules/StorageSytem/storageSystem.model");
const authenticateUser = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.authorization;
    // Check if token exists
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized access');
    }
    // Verify the token
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_ACCESS_SECRET);
    const { email, iat } = decoded;
    // Check if the user exists
    const user = yield user_model_1.User.isUserExistsByEmail(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // Check if the user is deleted
    if (user === null || user === void 0 ? void 0 : user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is already removed from the system');
    }
    // Check if the token was issued before the password was changed
    if ((user === null || user === void 0 ? void 0 : user.passwordChangedAt) &&
        user_model_1.User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat)) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized. Log in again');
    }
    // Return the decoded token
    return { decoded, user };
});
const auth = () => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { decoded } = yield authenticateUser(req);
        req.user = decoded;
        next();
    }));
};
exports.auth = auth;
// export const auth = () => {
//   return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const token = req.headers.authorization;
//     //check if token exist
//     if (!token) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthrized access');
//     }
//     const decoded = jwt.verify(
//       token,
//       config.JWT_ACCESS_SECRET as string,
//     ) as JwtPayload;
//     const { email, iat } = decoded;
//     const user = await User.isUserExistsByEmail(email);
//     if (!user) {
//       throw new AppError(httpStatus.NOT_FOUND, 'User not found');
//     }
//     // checking if the user is already deleted
//     const isDeleted = user?.isDeleted;
//     if (isDeleted) {
//       throw new AppError(
//         httpStatus.FORBIDDEN,
//         'User is already removed from system',
//       );
//     }
//     //check if the token is generated before the  password has changed
//     if (
//       user?.passwordChangedAt &&
//       User.isJWTIssuedBeforePasswordChanged(
//         user.passwordChangedAt,
//         iat as number,
//       )
//     ) {
//       throw new AppError(
//         httpStatus.FORBIDDEN,
//         'You are not authorized. Log in Again',
//       );
//     }
//     req.user = decoded as JwtPayload;
//     next();
//   });
// };
const isAllowed = (typeOfData) => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const { decoded, user } = yield authenticateUser(req);
        if (typeOfData === 'folder') {
            /**
              * parentFolder source :
              *         1. who needs parent Folder they will use 'parentFolderID'
              *         2. who doesn't need they will use 'folderID'
              *         3. or req.query.folderID
              *
              */
            const parentFolderID = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.parentFolderID) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.folderID) || ((_c = req.query) === null || _c === void 0 ? void 0 : _c.folderID);
            if (!parentFolderID) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Parent folder ID is required');
            }
            const parentFolderData = yield storageSystem_model_1.FolderModel.findOne({
                _id: parentFolderID,
                $or: [
                    { userID: user._id }, //own folder
                    { access: { $in: [user._id] } }, // get access by owner
                ],
                isDeleted: false,
            });
            if (!parentFolderData) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'File is not available');
            }
            if (parentFolderData.isSecured) {
                const { secureFolderToken } = req.cookies;
                if (!secureFolderToken) {
                    throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized to access secure folder');
                }
                // Validate the secure folder token
                // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
                const secureTokenData = jsonwebtoken_1.default.verify(secureFolderToken, config_1.default.JWT_ACCESS_SECRET);
            }
            const folderInfo = {
                userID: parentFolderData.userID,
                parentFolderID: parentFolderData._id,
                allowedUser: parentFolderData.access,
                isSecured: parentFolderData.isSecured
            };
            req.user = decoded;
            req.info = folderInfo;
        }
        else if (typeOfData === 'file') {
            /**
              * file source :
              *         1. who needs parent Folder they will use 'fileID'
              *         2. who doesn't need they will use 'fileID'
              *         3. or req.query.fileID
              *
              */
            const fileID = ((_d = req.body) === null || _d === void 0 ? void 0 : _d.fileID) || ((_e = req.body) === null || _e === void 0 ? void 0 : _e.fileID) || ((_f = req.query) === null || _f === void 0 ? void 0 : _f.fileID);
            if (!fileID) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'File ID is required');
            }
            const fileData = yield storageSystem_model_1.FileModel.findOne({
                _id: fileID,
                $or: [
                    { userID: user._id }, //own folder
                    { access: { $in: [user._id] } }, // get access by owner
                ],
                isDeleted: false,
            });
            if (!fileData) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'File is not available');
            }
            if (fileData.isSecured) {
                const { secureFolderToken } = req.cookies;
                if (!secureFolderToken) {
                    throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized to access secure folder');
                }
                // Validate the secure folder token
                // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
                const secureTokenData = jsonwebtoken_1.default.verify(secureFolderToken, config_1.default.JWT_ACCESS_SECRET);
            }
            const folderInfo = {
                userID: fileData.userID,
                parentFolderID: fileData.folderID,
                allowedUser: fileData.access,
                isSecured: fileData.isSecured
            };
            req.user = decoded;
            req.info = folderInfo;
        }
        next();
    }));
};
exports.isAllowed = isAllowed;
