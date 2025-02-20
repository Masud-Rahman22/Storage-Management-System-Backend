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
exports.StorageServices = void 0;
const storageSystem_model_1 = require("./storageSystem.model");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
const createFolder = (folderName, isSecured, parentFolderID, FolderOwnerID, currentUserEmail, allowedParentFolderUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email: currentUserEmail }).select('_id');
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'user not found');
    }
    const newFolder = yield storageSystem_model_1.FolderModel.create({
        userID: FolderOwnerID,
        folderName,
        parent: parentFolderID,
        isSecured,
        access: allowedParentFolderUser
    });
    return newFolder;
});
const shareFolder = (folderID, userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the user
    const user = yield user_model_1.User.findOne({ email: userEmail }).select('_id');
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // Add the user to access list
    const updatedFolder = yield storageSystem_model_1.FolderModel.findOneAndUpdate({ _id: folderID }, { $addToSet: { access: user._id } }, { new: true });
    if (!updatedFolder) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Folder not found');
    }
    return updatedFolder;
});
const duplicateFolder = (folderID) => __awaiter(void 0, void 0, void 0, function* () {
    const originalFolder = yield storageSystem_model_1.FolderModel.findById(folderID);
    if (!originalFolder) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Original Folder not found');
    }
    // Create a new folder with a modified name (appending " - Copy" to the original folder name)
    const newFolderName = `${originalFolder.folderName} - Copy`;
    const duplicatedFolder = yield storageSystem_model_1.FolderModel.create({
        userID: originalFolder.userID,
        folderName: newFolderName,
        parent: originalFolder.parent,
        isSecured: originalFolder.isSecured,
        access: [originalFolder.userID],
    });
    return duplicatedFolder;
});
const updateFolder = (folderID, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedFolder = yield storageSystem_model_1.FolderModel.findByIdAndUpdate(folderID, { $set: payload }, { new: true, runValidators: true });
    if (!updatedFolder) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Folder not found');
    }
    return updatedFolder;
});
const deleteFolder = (folderID) => __awaiter(void 0, void 0, void 0, function* () {
    yield storageSystem_model_1.FolderModel.findByIdAndUpdate(folderID, { isDeleted: true });
    return null;
});
// Allowed file types and categories
const allowedFileTypes = {
    Image: ['jpg', 'jpeg', 'png', 'webp'],
    Document: ['doc', 'docx', 'txt'],
    PDF: ['pdf'],
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFile = (file, folderInfo, currentUserEmail) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!file) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No file uploaded');
    }
    const user = yield user_model_1.User.findOne({ email: currentUserEmail }).select('_id limit');
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // Calculate total storage used
    const totalUsedStorage = yield storageSystem_model_1.FileModel.aggregate([
        { $match: { userID: user._id, isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);
    const currentStorageUsed = ((_a = totalUsedStorage[0]) === null || _a === void 0 ? void 0 : _a.totalSize) || 0;
    if (currentStorageUsed + file.size > user.limit) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Storage limit exceeded');
    }
    const fileExtension = path_1.default.extname(file.originalname).slice(1).toLowerCase();
    const dataType = Object.keys(allowedFileTypes).find((key) => allowedFileTypes[key].includes(fileExtension));
    const newFile = yield storageSystem_model_1.FileModel.create({
        name: file.originalname,
        uniqueFileName: file.filename,
        path: file.path,
        dataType,
        fileSize: file.size,
        isSecured: folderInfo.isSecured,
        folderID: folderInfo.parentFolderID,
        userID: folderInfo.userID,
        access: folderInfo.allowedUser,
    });
    return newFile;
});
const shareFile = (fileID, userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the user
    const user = yield user_model_1.User.findOne({ email: userEmail }).select('_id');
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // Add the user to access list
    const updatedFile = yield storageSystem_model_1.FileModel.findOneAndUpdate({ _id: fileID }, { $addToSet: { access: user._id } }, { new: true });
    if (!updatedFile) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'File not found');
    }
    return updatedFile;
});
const duplicateFile = (FileID, currentUserEmail) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_model_1.User.findOne({ email: currentUserEmail }).select('_id limit');
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    const originalFile = yield storageSystem_model_1.FileModel.findById(FileID);
    if (!originalFile) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Original Folder not found');
    }
    // Calculate total storage used
    const totalUsedStorage = yield storageSystem_model_1.FileModel.aggregate([
        { $match: { userID: user._id, isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);
    const currentStorageUsed = ((_a = totalUsedStorage[0]) === null || _a === void 0 ? void 0 : _a.totalSize) || 0;
    if (currentStorageUsed + originalFile.fileSize > user.limit) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Storage limit exceeded');
    }
    // Create a new folder with a modified name (appending " - Copy" to the original folder name)
    const newFileName = `Copy - ${originalFile.name}`;
    const duplicatedFolder = yield storageSystem_model_1.FileModel.create({
        name: newFileName,
        uniqueFileName: originalFile.uniqueFileName,
        path: originalFile.path,
        dataType: originalFile.dataType,
        fileSize: originalFile.fileSize,
        isSecured: originalFile.isSecured,
        folderID: originalFile.folderID,
        userID: originalFile.userID,
        access: [originalFile.userID],
    });
    return duplicatedFolder;
});
const updateFile = (fileID, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedFile = yield storageSystem_model_1.FileModel.findByIdAndUpdate(fileID, { $set: payload }, { new: true, runValidators: true });
    if (!updatedFile) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'File not found');
    }
    return updatedFile;
});
const deleteFile = (fileID) => __awaiter(void 0, void 0, void 0, function* () {
    yield storageSystem_model_1.FileModel.findByIdAndUpdate(fileID, { isDeleted: true });
    return null;
});
const getData = (query, email, cookies) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield user_model_1.User.findOne({ email });
    if (!userData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User doesnt exist');
    }
    const { isFavorite, dataType, day, folderID, fileID, securedFolder } = query;
    //search Favorite
    if (isFavorite) {
        const isFavorite_converted = isFavorite === 'true' ? true : false;
        if (!isFavorite_converted) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Wrong parameter');
        }
        const folders = yield storageSystem_model_1.FolderModel.find({
            userID: userData._id,
            isFavorite: isFavorite_converted,
            isSecured: false
        }).sort('-createdAt').lean();
        const files = yield storageSystem_model_1.FileModel.find({
            userID: userData._id,
            isFavorite: isFavorite_converted,
            isSecured: false
        }).sort('-createdAt').lean();
        return { folders, files };
    }
    //search by data type
    if (dataType) {
        if (typeof dataType !== 'string' || !['PDF', 'Image', 'Document'].includes(dataType)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `type must be string and value will be 'PDF', 'Image', 'Document'`);
        }
        const files = yield storageSystem_model_1.FileModel.find({
            userID: userData._id,
            dataType,
            isSecured: false
        }).sort('-createdAt').lean();
        return { files };
    }
    //search by day
    if (day) {
        const dateFormatRegex = /^\d{1,2}-\d{1,2}-\d{4}$/;
        if (typeof day !== 'string' || !dateFormatRegex.test(day)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid date format. Expected format: dd-mm-yyyy');
        }
        const [dayOfMonth, month, year] = day.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, dayOfMonth, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, dayOfMonth, 23, 59, 59));
        const folders = yield storageSystem_model_1.FolderModel.find({
            userID: userData._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            isSecured: false
        }).sort('-createdAt').lean();
        const files = yield storageSystem_model_1.FileModel.find({
            userID: userData._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            isSecured: false
        }).sort('-createdAt').lean();
        return { folders, files };
    }
    //search by folder ID
    if (folderID) {
        if (typeof folderID !== 'string') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid');
        }
        const folderData = yield storageSystem_model_1.FolderModel.findOne({
            _id: folderID,
            $or: [
                { userID: userData._id }, //own folder
                { access: { $in: [userData._id] } }, // get access by owner
            ],
        });
        console.log(folderData);
        if (!folderData) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No folder found');
        }
        if (folderData.isSecured) {
            const { secureFolderToken } = cookies;
            if (!secureFolderToken) {
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized to access secure folder');
            }
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            const secureTokenData = jsonwebtoken_1.default.verify(secureFolderToken, config_1.default.JWT_ACCESS_SECRET);
        }
        const folders = yield storageSystem_model_1.FolderModel.find({
            parent: folderID,
            $or: [
                { userID: userData._id }, //own folder
                { access: { $in: [userData._id] } }, // get access by owner
            ],
        }).sort('-createdAt').lean();
        const files = yield storageSystem_model_1.FileModel.find({
            folderID: folderID,
            $or: [
                { userID: userData._id }, //own folder
                { access: { $in: [userData._id] } }, // get access by owner
            ],
        }).sort('-createdAt').lean();
        return { folders, files };
    }
    if (fileID) {
        if (typeof fileID !== 'string') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid');
        }
        const fileData = yield storageSystem_model_1.FileModel.findOne({
            _id: fileID,
            $or: [
                { userID: userData._id }, //own folder
                { access: { $in: [userData._id] } }, // get access by owner
            ],
        });
        if (!fileData) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No folder found');
        }
        if (fileData.isSecured) {
            const { secureFolderToken } = cookies;
            if (!secureFolderToken) {
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized to access secure file');
            }
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            const secureTokenData = jsonwebtoken_1.default.verify(secureFolderToken, config_1.default.JWT_ACCESS_SECRET);
        }
        return { fileData };
    }
    if (securedFolder) {
        const securedFolder_converted = securedFolder === 'true' ? true : false;
        if (!securedFolder_converted) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Wrong parameter');
        }
        const { secureFolderToken } = cookies;
        if (!secureFolderToken) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized to access secure folder');
        }
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        const secureTokenData = jsonwebtoken_1.default.verify(secureFolderToken, config_1.default.JWT_ACCESS_SECRET);
        const folders = yield storageSystem_model_1.FolderModel.find({
            parent: userData.securedrootFolderID,
            userID: userData._id
        }).sort('-createdAt').lean();
        const files = yield storageSystem_model_1.FileModel.find({
            folderID: userData.securedrootFolderID,
            userID: userData._id
        }).sort('-createdAt').lean();
        return { folders, files };
    }
    const folders = yield storageSystem_model_1.FolderModel.find({
        parent: userData.rootFolderID,
        userID: userData._id
    }).sort('-createdAt').lean();
    const files = yield storageSystem_model_1.FileModel.find({
        folderID: userData.rootFolderID,
        userID: userData._id
    }).sort('-createdAt').lean();
    return { folders, files };
});
exports.StorageServices = {
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
    getData
};
