import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from '../error/AppError';
import config from '../config';
import { User } from '../modules/user/user.model';
import catchAsync from '../../utils/catchAsync';
import { TUser } from '../modules/user/user.interface';
import { FileModel, FolderModel } from '../app/modules/StorageSytem/storageSystem.model';
import { info } from '../app/modules/StorageSytem/storageSystem.interface';


const authenticateUser = async (req: Request): Promise<{ decoded: JwtPayload; user: TUser }> => {
  const token = req.headers.authorization;

  // Check if token exists
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  // Verify the token
  const decoded = jwt.verify(
    token,
    config.JWT_ACCESS_SECRET as string
  ) as JwtPayload;

  const { email, iat } = decoded;

  // Check if the user exists
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if the user is deleted
  if (user?.isDeleted) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'User is already removed from the system'
    );
  }

  // Check if the token was issued before the password was changed
  if (
    user?.passwordChangedAt &&
    User.isJWTIssuedBeforePasswordChanged(
      user.passwordChangedAt,
      iat as number
    )
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized. Log in again'
    );
  }

  // Return the decoded token
  return { decoded, user };
};

export const auth = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { decoded } = await authenticateUser(req);
    req.user = decoded
    next();
  });
};
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



export const isAllowed = (typeOfData: 'file' | 'folder') => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { decoded, user } = await authenticateUser(req);


    if (typeOfData === 'folder') {
      /**
        * parentFolder source : 
        *         1. who needs parent Folder they will use 'parentFolderID'
        *         2. who doesn't need they will use 'folderID'
        *         3. or req.query.folderID
        *        
        */
      const parentFolderID = req.body?.parentFolderID || req.body?.folderID || req.query?.folderID;
      if (!parentFolderID) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Parent folder ID is required');
      }

      const parentFolderData = await FolderModel.findOne({
        _id: parentFolderID,
        $or: [
          { userID: user._id }, //own folder
          { access: { $in: [user._id] } }, // get access by owner
        ],
        isDeleted: false,
      });
      if (!parentFolderData) {
        throw new AppError(httpStatus.BAD_REQUEST, 'File is not available');
      }

      if (parentFolderData.isSecured) {
        const { secureFolderToken } = req.cookies;
        if (!secureFolderToken) {
          throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized to access secure folder');
        }

        // Validate the secure folder token
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        const secureTokenData = jwt.verify(
          secureFolderToken,
          config.JWT_ACCESS_SECRET as string
        ) as JwtPayload;
      }

      const folderInfo: info = {
        userID: parentFolderData.userID,
        parentFolderID: parentFolderData._id,
        allowedUser: parentFolderData.access,
        isSecured: parentFolderData.isSecured
      }
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
      const fileID = req.body?.fileID || req.body?.fileID || req.query?.fileID;
      if (!fileID) {
        throw new AppError(httpStatus.BAD_REQUEST, 'File ID is required');
      }

      const fileData = await FileModel.findOne({
        _id: fileID,
        $or: [
          { userID: user._id }, //own folder
          { access: { $in: [user._id] } }, // get access by owner
        ],
        isDeleted: false,
      });
      if (!fileData) {
        throw new AppError(httpStatus.BAD_REQUEST, 'File is not available');
      }

      if (fileData.isSecured) {
        const { secureFolderToken } = req.cookies;
        if (!secureFolderToken) {
          throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized to access secure folder');
        }

        // Validate the secure folder token
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        const secureTokenData = jwt.verify(
          secureFolderToken,
          config.JWT_ACCESS_SECRET as string
        ) as JwtPayload;
      }

      const folderInfo: info = {
        userID: fileData.userID,
        parentFolderID: fileData.folderID,
        allowedUser: fileData.access,
        isSecured: fileData.isSecured
      }



      req.user = decoded;
      req.info = folderInfo;
    }

    next();
  });
};