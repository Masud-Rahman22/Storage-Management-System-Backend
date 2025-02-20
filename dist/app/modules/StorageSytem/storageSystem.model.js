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
exports.FileModel = exports.FolderModel = void 0;
const mongoose_1 = require("mongoose");
const config_1 = __importDefault(require("../../config"));
const FolderSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    folderName: {
        type: String,
        required: true,
    },
    access: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    parent: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Folder',
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    isSecured: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
FolderSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = this;
        // Ensure the userID is included in the access array
        if (folder.userID && !folder.access.includes(folder.userID)) {
            folder.access.push(folder.userID);
        }
        next();
    });
});
// filter out deleted documents
FolderSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
FolderSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
FolderSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});
exports.FolderModel = (0, mongoose_1.model)('Folder', FolderSchema);
const FileSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    uniqueFileName: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    dataType: {
        type: String,
        enum: ['PDF', 'Image', 'Document'],
    },
    fileSize: {
        type: Number,
        required: true
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    isSecured: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    folderID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    access: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
});
FileSchema.virtual('pathName').get(function () {
    const baseURL = config_1.default.SERVER_URL;
    return `${baseURL}/uploads/${this.uniqueFileName}`;
});
FileSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const file = this;
        if (file.userID && !file.access.includes(file.userID)) {
            file.access.push(file.userID);
        }
        next();
    });
});
// filter out deleted documents
FileSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
FileSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
FileSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});
exports.FileModel = (0, mongoose_1.model)('File', FileSchema);
