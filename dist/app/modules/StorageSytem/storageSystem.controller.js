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
exports.StorageControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const storageSystem_service_1 = require("./storageSystem.service");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const createFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { isSecured, parentFolderID, userID, allowedUser } = req.info;
    const folderName = (_a = req.body) === null || _a === void 0 ? void 0 : _a.folderName;
    const { email } = req.user;
    const result = yield storageSystem_service_1.StorageServices.createFolder(folderName, isSecured, parentFolderID, userID, email, allowedUser);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Folder created successfully',
        data: result,
    });
}));
const shareFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const folderID = (_a = req.body) === null || _a === void 0 ? void 0 : _a.folderID;
    const email = (_b = req.body) === null || _b === void 0 ? void 0 : _b.email;
    const result = yield storageSystem_service_1.StorageServices.shareFolder(folderID, email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Folder shared successfully',
        data: result,
    });
}));
const duplicateFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield storageSystem_service_1.StorageServices.duplicateFolder((_a = req.body) === null || _a === void 0 ? void 0 : _a.folderID);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Folder is duplicated successfully',
        data: result,
    });
}));
const updateFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const folderID = (_a = req.query) === null || _a === void 0 ? void 0 : _a.folderID;
    if (!folderID || Array.isArray(folderID)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Folder ID is required');
    }
    const result = yield storageSystem_service_1.StorageServices.updateFolder(folderID, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Folder is updated successfully',
        data: result,
    });
}));
const deleteFolder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const folderID = (_a = req.query) === null || _a === void 0 ? void 0 : _a.folderID;
    if (!folderID || Array.isArray(folderID)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Folder ID is required');
    }
    const result = yield storageSystem_service_1.StorageServices.deleteFolder(folderID);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Folder is deleted successfully',
        data: result,
    });
}));
/**
 * ----------------------- File Management --------------------------
 */
const createFile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const folderInfo = req.info;
    const { email } = req.user;
    const result = yield storageSystem_service_1.StorageServices.createFile(req.file, folderInfo, email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'New file uploaded successfully',
        data: result,
    });
}));
const shareFile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const fileID = (_a = req.body) === null || _a === void 0 ? void 0 : _a.fileID;
    const email = (_b = req.body) === null || _b === void 0 ? void 0 : _b.email;
    const result = yield storageSystem_service_1.StorageServices.shareFile(fileID, email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'File shared successfully',
        data: result,
    });
}));
const duplicateFile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email } = req.user;
    const result = yield storageSystem_service_1.StorageServices.duplicateFile((_a = req.body) === null || _a === void 0 ? void 0 : _a.fileID, email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'File is duplicated successfully',
        data: result,
    });
}));
const updateFile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const fileID = (_a = req.query) === null || _a === void 0 ? void 0 : _a.fileID;
    if (!fileID || Array.isArray(fileID)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'File ID is required');
    }
    const result = yield storageSystem_service_1.StorageServices.updateFile(fileID, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'File is updated successfully',
        data: result,
    });
}));
const deleteFile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const fileID = (_a = req.query) === null || _a === void 0 ? void 0 : _a.fileID;
    if (!fileID || Array.isArray(fileID)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Folder ID is required');
    }
    const result = yield storageSystem_service_1.StorageServices.deleteFile(fileID);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'File is deleted successfully',
        data: result,
    });
}));
const getData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.user;
    const result = yield storageSystem_service_1.StorageServices.getData(req.query, email, req.cookies);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Data retreived successfully',
        data: result,
    });
}));
exports.StorageControllers = {
    createFolder,
    shareFolder,
    duplicateFolder,
    updateFolder,
    deleteFolder,
    createFile,
    shareFile,
    duplicateFile,
    updateFile,
    deleteFile,
    getData,
};
