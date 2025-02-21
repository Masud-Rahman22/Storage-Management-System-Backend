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
exports.sendImageToCloudinary = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const AppError_1 = __importDefault(require("../error/AppError"));
const config_1 = __importDefault(require("../config"));
// Define allowed file extensions
const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'txt', 'pdf'];
// Configure Multer to store file in memory (RAM)
const storage = multer_1.default.memoryStorage();
// File filter for validating file extensions
// eslint-disable-next-line no-undef
const fileFilter = (req, file, cb) => {
    const fileExtension = path_1.default.extname(file.originalname).slice(1).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        cb(new AppError_1.default(400, 'Invalid file type'));
    }
    else {
        cb(null, true);
    }
};
// Multer instance
exports.upload = (0, multer_1.default)({ storage, fileFilter });
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: config_1.default.Clourdinary_cloud_name,
    api_key: config_1.default.Clourdinary_api_key,
    api_secret: config_1.default.Clourdinary_api_secret,
});
// Function to upload file to Cloudinary
const sendImageToCloudinary = (imageName, fileBuffer) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload_stream({ public_id: imageName.trim() }, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result);
        }).end(fileBuffer);
    });
});
exports.sendImageToCloudinary = sendImageToCloudinary;
