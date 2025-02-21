import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import AppError from '../error/AppError';
import config from '../config';

// Define allowed file extensions
const allowedExtensions: string[] = ['jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'txt', 'pdf'];

// Configure Multer to store file in memory (RAM)
const storage = multer.memoryStorage();

// File filter for validating file extensions
// eslint-disable-next-line no-undef
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    cb(new AppError(400, 'Invalid file type'));
  } else {
    cb(null, true);
  }
};

// Multer instance
export const upload = multer({ storage, fileFilter });

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.Clourdinary_cloud_name,
  api_key: config.Clourdinary_api_key,
  api_secret: config.Clourdinary_api_secret,
});

// Function to upload file to Cloudinary
export const sendImageToCloudinary = async (
  imageName: string,
  fileBuffer: Buffer,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ public_id: imageName.trim() }, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result as UploadApiResponse);
    }).end(fileBuffer);
  });
};