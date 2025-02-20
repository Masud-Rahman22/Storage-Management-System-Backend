"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../app/errors/AppError"));
// Define allowed file extensions
const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'txt', 'pdf'];
// Multer storage configuration
const storage = multer_1.default.diskStorage({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
    destination: (req, file, cb) => {
        // cb(null, process.cwd() + '/uploads/'); // Directory to save uploaded files
        cb(null, path_1.default.join('uploads'));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
    filename: (req, file, cb) => {
        var _a;
        const userID = ((_a = req.info) === null || _a === void 0 ? void 0 : _a.userID) || 'anonymous'; // Assume `req.user` has user info with `_id`
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${userID}-${uniqueSuffix}${fileExtension}`);
    },
});
// File filter for validating file extensions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileFilter = (req, file, cb) => {
    const fileExtension = path_1.default.extname(file.originalname).slice(1).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        cb(new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid file type'));
    }
    else {
        cb(null, true);
    }
};
// Export the configured Multer instance
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
});
