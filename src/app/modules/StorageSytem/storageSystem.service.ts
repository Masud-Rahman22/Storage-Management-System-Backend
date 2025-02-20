import { Types } from "mongoose";
import { FileModel, FolderModel } from "./storageSystem.model";
import { User } from "../user/user.model";
import httpStatus from 'http-status';
import { TFile, TFolder, info } from "./storageSystem.interface";
import path from "path";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import AppError from "../../error/AppError";

const createFolder = async (
    folderName: string,
    isSecured: boolean,
    parentFolderID: Types.ObjectId,
    FolderOwnerID: Types.ObjectId,
    currentUserEmail: string,
    allowedParentFolderUser : Types.ObjectId[]
) => {
    const user = await User.findOne({ email: currentUserEmail }).select('_id');

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'user not found')
    }
   
    const newFolder = await FolderModel.create({
        userID: FolderOwnerID,
        folderName,
        parent: parentFolderID,
        isSecured,
        access: allowedParentFolderUser
    })

    return newFolder;
};

const shareFolder = async (
    folderID: Types.ObjectId,
    userEmail: string
) => {
    // Find the user
    const user = await User.findOne({ email: userEmail }).select('_id');

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Add the user to access list
    const updatedFolder = await FolderModel.findOneAndUpdate(
        { _id: folderID },
        { $addToSet: { access: user._id } },
        { new: true }
    );

    if (!updatedFolder) {
        throw new AppError(httpStatus.NOT_FOUND, 'Folder not found');
    }

    return updatedFolder;
};

const duplicateFolder = async (folderID: Types.ObjectId) => {

    const originalFolder = await FolderModel.findById(folderID);

    if (!originalFolder) {
        throw new AppError(httpStatus.NOT_FOUND, 'Original Folder not found');
    }

    // Create a new folder with a modified name (appending " - Copy" to the original folder name)
    const newFolderName = `${originalFolder.folderName} - Copy`;

    const duplicatedFolder = await FolderModel.create({
        userID: originalFolder.userID,
        folderName: newFolderName,
        parent: originalFolder.parent,
        isSecured: originalFolder.isSecured,
        access: [originalFolder.userID],
    })
    return duplicatedFolder;
};

const updateFolder = async (folderID: string, payload: Partial<TFolder>) => {
    const updatedFolder = await FolderModel.findByIdAndUpdate(
        folderID,
        { $set: payload },
        { new: true, runValidators: true }
    );

    if (!updatedFolder) {
        throw new AppError(httpStatus.NOT_FOUND, 'Folder not found');
    }

    return updatedFolder;
};
const deleteFolder = async (folderID: string) => {
    await FolderModel.findByIdAndUpdate(
        folderID,
        { isDeleted: true }
    );

    return null;
};

// Allowed file types and categories
const allowedFileTypes: { [key: string]: string[] } = {
    Image: ['jpg', 'jpeg', 'png', 'webp'],
    Document: ['doc', 'docx', 'txt'],
    PDF: ['pdf'],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFile = async (file: any, folderInfo: info, currentUserEmail: string) => {
    if (!file) {
        throw new AppError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const user = await User.findOne({ email: currentUserEmail }).select('_id limit');
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Calculate total storage used
    const totalUsedStorage = await FileModel.aggregate([
        { $match: { userID: user._id, isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);
    const currentStorageUsed = totalUsedStorage[0]?.totalSize || 0;
    if (currentStorageUsed + file.size > user.limit) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Storage limit exceeded');
    }


    const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();
    const dataType = Object.keys(allowedFileTypes).find((key) =>
        allowedFileTypes[key].includes(fileExtension)
    );




    const newFile = await FileModel.create({
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
};


const shareFile = async (
    fileID: Types.ObjectId,
    userEmail: string
) => {
    // Find the user
    const user = await User.findOne({ email: userEmail }).select('_id');

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Add the user to access list
    const updatedFile = await FileModel.findOneAndUpdate(
        { _id: fileID },
        { $addToSet: { access: user._id } },
        { new: true }
    );

    if (!updatedFile) {
        throw new AppError(httpStatus.NOT_FOUND, 'File not found');
    }

    return updatedFile;
};

const duplicateFile = async (FileID: Types.ObjectId, currentUserEmail: string) => {

    const user = await User.findOne({ email: currentUserEmail }).select('_id limit');
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    const originalFile = await FileModel.findById(FileID);

    if (!originalFile) {
        throw new AppError(httpStatus.NOT_FOUND, 'Original Folder not found');
    }
    // Calculate total storage used
    const totalUsedStorage = await FileModel.aggregate([
        { $match: { userID: user._id, isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);
    const currentStorageUsed = totalUsedStorage[0]?.totalSize || 0;

    if (currentStorageUsed + originalFile.fileSize > user.limit) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Storage limit exceeded');
    }


    // Create a new folder with a modified name (appending " - Copy" to the original folder name)
    const newFileName = `Copy - ${originalFile.name}`;

    const duplicatedFolder = await FileModel.create({
        name: newFileName,
        uniqueFileName: originalFile.uniqueFileName,
        path: originalFile.path,
        dataType: originalFile.dataType,
        fileSize: originalFile.fileSize,
        isSecured: originalFile.isSecured,
        folderID: originalFile.folderID,
        userID: originalFile.userID,
        access: [originalFile.userID],
    })
    return duplicatedFolder;
};

const updateFile = async (fileID: string, payload: Partial<TFile>) => {
    const updatedFile = await FileModel.findByIdAndUpdate(
        fileID,
        { $set: payload },
        { new: true, runValidators: true }
    );

    if (!updatedFile) {
        throw new AppError(httpStatus.NOT_FOUND, 'File not found');
    }

    return updatedFile;
};


const deleteFile = async (fileID: string) => {
    await FileModel.findByIdAndUpdate(
        fileID,
        { isDeleted: true }
    );

    return null;
};


const getData = async (query: Record<string, unknown>, email: string, cookies: Record<string, string>) => {
    const userData = await User.findOne({ email });

    if (!userData) {
        throw new AppError(httpStatus.NOT_FOUND, 'User doesnt exist');
    }
    const { isFavorite, dataType, day, folderID, fileID, securedFolder } = query;

    //search Favorite
    if (isFavorite) {
        const isFavorite_converted = isFavorite === 'true' ? true : false;
        if (!isFavorite_converted) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Wrong parameter');
        }
        const folders = await FolderModel.find(
            {
                userID: userData._id,
                isFavorite: isFavorite_converted,
                isSecured: false
            }
        ).sort('-createdAt').lean();
        const files = await FileModel.find(
            {
                userID: userData._id,
                isFavorite: isFavorite_converted,
                isSecured: false
            }
        ).sort('-createdAt').lean();

        return { folders, files };
    }

    //search by data type
    if (dataType) {
        if (typeof dataType !== 'string' || !['PDF', 'Image', 'Document'].includes(dataType)) {
            throw new AppError(httpStatus.BAD_REQUEST, `type must be string and value will be 'PDF', 'Image', 'Document'`);
        }
        const files = await FileModel.find(
            {
                userID: userData._id,
                dataType,
                isSecured: false
            }
        ).sort('-createdAt').lean();

        return { files };
    }

    //search by day
    if (day) {
        const dateFormatRegex = /^\d{1,2}-\d{1,2}-\d{4}$/;

        if (typeof day !== 'string' || !dateFormatRegex.test(day)) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Invalid date format. Expected format: dd-mm-yyyy');
        }

        const [dayOfMonth, month, year] = day.split('-').map(Number);

        const startOfDay = new Date(Date.UTC(year, month - 1, dayOfMonth, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, dayOfMonth, 23, 59, 59));
        const folders = await FolderModel.find(
            {
                userID: userData._id,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                isSecured: false
            }
        ).sort('-createdAt').lean();
        const files = await FileModel.find(
            {
                userID: userData._id,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                isSecured: false
            }
        ).sort('-createdAt').lean();

        return { folders, files };
    }

    //search by folder ID
    if (folderID) {
 
        if (typeof folderID !== 'string') {
            throw new AppError(httpStatus.BAD_REQUEST, 'Invalid');
        }
        const folderData = await FolderModel.findOne(
            {
                _id: folderID as string,
                $or: [
                    { userID: userData._id }, //own folder
                    { access: { $in: [userData._id] } }, // get access by owner
                ],

            }
        );
console.log(folderData)
        if (!folderData) {
            throw new AppError(httpStatus.NOT_FOUND, 'No folder found');
        }
        if (folderData.isSecured) {
            const { secureFolderToken } = cookies;
            if (!secureFolderToken) {
                throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized to access secure folder');
            }


            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            const secureTokenData = jwt.verify(
                secureFolderToken,
                config.JWT_ACCESS_SECRET as string
            ) as JwtPayload;
        }

        const folders = await FolderModel.find(
            {

                parent: folderID,
                $or: [
                    { userID: userData._id }, //own folder
                    { access: { $in: [userData._id] } }, // get access by owner
                ],

            }
        ).sort('-createdAt').lean();
        const files = await FileModel.find(
            {

                folderID: folderID,
                $or: [
                    { userID: userData._id }, //own folder
                    { access: { $in: [userData._id] } }, // get access by owner
                ],

            }
        ).sort('-createdAt').lean();

        return { folders, files };


    }
    if (fileID) {
        if (typeof fileID !== 'string') {
            throw new AppError(httpStatus.BAD_REQUEST, 'Invalid');
        }
        const fileData = await FileModel.findOne(
            {
                _id: fileID,
                $or: [
                    { userID: userData._id }, //own folder
                    { access: { $in: [userData._id] } }, // get access by owner
                ],
            }
        );

        if (!fileData) {
            throw new AppError(httpStatus.NOT_FOUND, 'No folder found');
        }
        if (fileData.isSecured) {
            const { secureFolderToken } = cookies;
            if (!secureFolderToken) {
                throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized to access secure file');
            }


            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            const secureTokenData = jwt.verify(
                secureFolderToken,
                config.JWT_ACCESS_SECRET as string
            ) as JwtPayload;
        }

        return { fileData };


    }

    if (securedFolder) {
        const securedFolder_converted = securedFolder === 'true' ? true : false;
        if (!securedFolder_converted) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Wrong parameter');
        }

        const { secureFolderToken } = cookies;
        if (!secureFolderToken) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized to access secure folder');
        }


        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        const secureTokenData = jwt.verify(
            secureFolderToken,
            config.JWT_ACCESS_SECRET as string
        ) as JwtPayload;

        const folders = await FolderModel.find(
            {
                parent: userData.securedrootFolderID,
                userID: userData._id
            }
        ).sort('-createdAt').lean();

        const files = await FileModel.find(
            {
                folderID: userData.securedrootFolderID,
                userID: userData._id
            }
        ).sort('-createdAt').lean();

        return { folders, files };
    }

    const folders = await FolderModel.find(
        {
            parent: userData.rootFolderID,
            userID: userData._id
        }
    ).sort('-createdAt').lean();

    const files = await FileModel.find(
        {
            folderID: userData.rootFolderID,
            userID: userData._id
        }
    ).sort('-createdAt').lean();

    return { folders, files };

};

export const StorageServices = {
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