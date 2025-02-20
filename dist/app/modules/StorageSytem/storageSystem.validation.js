"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageValidationSchema = void 0;
const zod_1 = require("zod");
const createFolderValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        folderName: zod_1.z.string({ required_error: 'Folder Name is required' }),
        parentFolderID: zod_1.z.string({ required_error: 'Parent folder ID is required' }),
    }),
});
const shareFolderValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        folderID: zod_1.z.string({ required_error: 'Folder ID is required' }),
        email: zod_1.z.string({ required_error: 'Email is required' }),
    }),
});
const duplicateFolderValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        folderID: zod_1.z.string({ required_error: 'Folder ID is required' }),
    }),
});
const updateFolderValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        folderName: zod_1.z.string({ required_error: 'Folder name is required' }).optional(),
        isFavorite: zod_1.z.boolean().optional(),
    }),
});
const shareFileValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        fileID: zod_1.z.string({ required_error: 'File ID is required' }),
        email: zod_1.z.string({ required_error: 'Email is required' }),
    }),
});
const duplicateFileValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        fileID: zod_1.z.string({ required_error: 'file ID is required' }),
    }),
});
const updateFileValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'File name is required' }).optional(),
        isFavorite: zod_1.z.boolean().optional(),
    }),
});
exports.StorageValidationSchema = {
    createFolderValidationSchema,
    shareFolderValidationSchema,
    duplicateFolderValidationSchema,
    updateFolderValidationSchema,
    shareFileValidationSchema,
    duplicateFileValidationSchema,
    updateFileValidationSchema
};
