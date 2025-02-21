import { RequestHandler } from 'express';
import catchAsync from '../../../utils/catchAsync';
import { StorageServices } from './storageSystem.service';
import sendResponse from '../../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';

const createFolder: RequestHandler = catchAsync(async (req, res) => {
  const { isSecured, parentFolderID, userID, allowedUser } = req.info;
  const folderName = req.body?.folderName;
  const { email } = req.user;
  const result = await StorageServices.createFolder(
    folderName,
    isSecured,
    parentFolderID,
    userID,
    email,
    allowedUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder created successfully',
    data: result,
  });
});

const shareFolder: RequestHandler = catchAsync(async (req, res) => {
  const folderID = req.body?.folderID;
  const email = req.body?.email;
  const result = await StorageServices.shareFolder(folderID, email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder shared successfully',
    data: result,
  });
});
const duplicateFolder: RequestHandler = catchAsync(async (req, res) => {
  const result = await StorageServices.duplicateFolder(req.body?.folderID);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder is duplicated successfully',
    data: result,
  });
});
const updateFolder: RequestHandler = catchAsync(async (req, res) => {
  const folderID = req.query?.folderID;

  if (!folderID || Array.isArray(folderID)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder ID is required');
  }
  const result = await StorageServices.updateFolder(
    folderID as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder is updated successfully',
    data: result,
  });
});

const deleteFolder: RequestHandler = catchAsync(async (req, res) => {
  const folderID = req.query?.folderID;

  if (!folderID || Array.isArray(folderID)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder ID is required');
  }
  const result = await StorageServices.deleteFolder(folderID as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder is deleted successfully',
    data: result,
  });
});

/**
 * ----------------------- File Management --------------------------
 */

const createFile: RequestHandler = catchAsync(async (req, res) => {
  const folderInfo = req.info;
  const { email } = req.user;
  const result = await StorageServices.createFile(req.file, folderInfo, email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'New file uploaded successfully',
    data: result,
  });
});

const shareFile: RequestHandler = catchAsync(async (req, res) => {
  const fileID = req.body?.fileID;
  const email = req.body?.email;
  const result = await StorageServices.shareFile(fileID, email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File shared successfully',
    data: result,
  });
});

const duplicateFile: RequestHandler = catchAsync(async (req, res) => {
  const { email } = req.user;
  const result = await StorageServices.duplicateFile(req.body?.fileID, email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File is duplicated successfully',
    data: result,
  });
});

const updateFile: RequestHandler = catchAsync(async (req, res) => {
  const fileID = req.query?.fileID;

  if (!fileID || Array.isArray(fileID)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'File ID is required');
  }
  const result = await StorageServices.updateFile(fileID as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File is updated successfully',
    data: result,
  });
});

const deleteFile: RequestHandler = catchAsync(async (req, res) => {
  const fileID = req.query?.fileID;

  if (!fileID || Array.isArray(fileID)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder ID is required');
  }
  const result = await StorageServices.deleteFile(fileID as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File is deleted successfully',
    data: result,
  });
});

const getData = catchAsync(async (req, res) => {
  const { email } = req.user;
  const result = await StorageServices.getData(req.query, email, req.cookies);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Data retreived successfully',

    data: result,
  });
});
export const StorageControllers = {
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
