import express from 'express';
import { StorageControllers } from './storageSystem.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { StorageValidationSchema } from './storageSystem.validation';
import { auth, isAllowed } from '../../middlewares/auth';
import { upload } from '../../middlewares/uploadFiles';

const router = express.Router();

router.post(
    '/create-folder',
    validateRequest(StorageValidationSchema.createFolderValidationSchema),
    isAllowed('folder'),
    StorageControllers.createFolder,
);
router.post(
    '/share-folder',
    validateRequest(StorageValidationSchema.shareFolderValidationSchema),
    isAllowed('folder'),
    StorageControllers.shareFolder,
);
router.post(
    '/duplicate-folder',
    validateRequest(StorageValidationSchema.duplicateFolderValidationSchema),
    isAllowed('folder'),
    StorageControllers.duplicateFolder,
);
router.patch(
    '/update-folder',
    validateRequest(StorageValidationSchema.updateFolderValidationSchema),
    isAllowed('folder'),
    StorageControllers.updateFolder,
);
router.delete(
    '/delete-folder',
    isAllowed('folder'),
    StorageControllers.deleteFolder,
);


router.post(
    '/upload-file',
    isAllowed('folder'),
    upload.single('file'),
    StorageControllers.createFile,
);
router.post(
    '/share-file',
    validateRequest(StorageValidationSchema.shareFileValidationSchema),
    isAllowed('file'),
    StorageControllers.shareFile,
);

router.post(
    '/duplicate-file',
    validateRequest(StorageValidationSchema.duplicateFileValidationSchema),
    isAllowed('file'),
    StorageControllers.duplicateFile,
);
router.patch(
    '/update-file',
    validateRequest(StorageValidationSchema.updateFileValidationSchema),
    isAllowed('file'),
    StorageControllers.updateFile,
);
router.delete(
    '/delete-file',
    isAllowed('file'),
    StorageControllers.deleteFile,
);

router.get('/get-data',auth(),StorageControllers.getData)
export const StorageSystemRouter = router;