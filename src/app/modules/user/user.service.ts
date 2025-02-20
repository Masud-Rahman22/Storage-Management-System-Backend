import mongoose, { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { TLoginUser, TUser } from "./user.interface";
import { User } from "./user.model";
import httpStatus from 'http-status';
import { FileModel, FolderModel } from "../StorageSytem/storageSystem.model";
import config from "../../config";
import { createSecuredFolderToken, createToken, createVerifyUserToken } from "./user.utils";
import { JwtPayload } from "jsonwebtoken";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail } from "../../../utils/sendEmail";
import { generateOTP } from "../../../utils/utility";
import { OAuth2Client } from "google-auth-library";

const UpdatePassword = async (userID: Types.ObjectId, newPassword: string) => {
    const newHashedPassword = await bcrypt.hash(
        newPassword,
        Number(config.bcrypt_salt_round),
    );
    await User.findOneAndUpdate(
        {
            _id: userID,
        },
        {
            password: newHashedPassword,
            needsPasswordChange: false,
            passwordChangedAt: new Date(),
        },
    );
}

const gClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);
const googleAuth = async (tokenId: string) => {

    if (!tokenId) {
        throw new AppError(httpStatus.BAD_REQUEST, "credential is required");

    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await gClient
        .verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        })

    const user = await User.findOne({ email: result.payload.email })


    if (user) {
        // already signed up user
        const jwtPayload = {
            email: user.email,
            rootFolder: user.rootFolderID
        };
        const accessToken = createToken(
            jwtPayload,
            config.JWT_ACCESS_SECRET as string,
            config.JWT_ACCESS_EXPIRES_IN as string,
        );

        const refreshToken = createToken(
            jwtPayload,
            config.JWT_REFRESH_SECRET as string,
            config.JWT_REFRESH_EXPIRES_IN as string,
        );


        return {
            user: {
                _id: user._id,
                email: user.email,
                userName: user.userName,
                limit: user.limit,
                rootFolderID: user.rootFolderID,
            },
            accessToken,
            refreshToken
        };

    } else {
        //new user
        const userData: Partial<TUser> = {
            email: result.payload.email,
            userName: result.payload.given_name + result.payload.family_name,
        };

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Create the user
            const user = await User.create([userData], { session });
            if (!user.length) {
                throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create user');
            }

            const RootfolderData = {
                userID: user[0]._id,
                folderName: 'My Folder',
                access: [user[0]._id],
            }

            // Create the root folder
            const newRootFolder = await FolderModel.create([RootfolderData], { session });
            if (!newRootFolder.length) {
                throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Root folder');
            }

            //Update the user with rootFolderID
            const updateResult = await User.updateOne(
                { _id: user[0]._id },
                { rootFolderID: newRootFolder[0]._id },
                { session }
            );

            if (!updateResult.matchedCount || !updateResult.modifiedCount) {
                throw new AppError(httpStatus.BAD_REQUEST, 'Failed to associate root folder with user');
            }


            await session.commitTransaction();

            // create token and sent to the client

            const jwtPayload = {
                email: user[0].email,
                rootFolder: newRootFolder[0]._id
            };
            const accessToken = createToken(
                jwtPayload,
                config.JWT_ACCESS_SECRET as string,
                config.JWT_ACCESS_EXPIRES_IN as string,
            );

            const refreshToken = createToken(
                jwtPayload,
                config.JWT_REFRESH_SECRET as string,
                config.JWT_REFRESH_EXPIRES_IN as string,
            );


            return {
                user: {
                    _id: user[0]._id,
                    email: user[0].email,
                    userName: user[0].userName,
                    limit: user[0].limit,
                    rootFolderID: newRootFolder[0]._id,
                },
                accessToken,
                refreshToken
            };
        } catch (error) {

            await session.abortTransaction();

            throw new AppError(
                httpStatus.BAD_REQUEST,
                (error as Error).message || 'An unknown error occurred',
                (error as Error)?.stack,
            );
        } finally {

            await session.endSession();
        }

    }



}

const SignUp = async (payload: TUser) => {
    const isUserExist = await User.isUserExistsByEmail(payload.email);
    if (isUserExist) {
        throw new AppError(httpStatus.CONFLICT, 'User Already exists');
    }

    const userData: Partial<TUser> = {
        email: payload.email,
        userName: payload.userName,
        password: payload.password,
    };

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Create the user
        const user = await User.create([userData], { session });
        if (!user.length) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create user');
        }

        const RootfolderData = {
            userID: user[0]._id,
            folderName: 'My Folder',
            access: [user[0]._id],
        }

        // Create the root folder
        const newRootFolder = await FolderModel.create([RootfolderData], { session });
        if (!newRootFolder.length) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Root folder');
        }

        //Update the user with rootFolderID
        const updateResult = await User.updateOne(
            { _id: user[0]._id },
            { rootFolderID: newRootFolder[0]._id },
            { session }
        );

        if (!updateResult.matchedCount || !updateResult.modifiedCount) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Failed to associate root folder with user');
        }


        await session.commitTransaction();

        // create token and sent to the client

        const jwtPayload = {
            email: user[0].email,
            rootFolder: newRootFolder[0]._id
        };
        const accessToken = createToken(
            jwtPayload,
            config.JWT_ACCESS_SECRET as string,
            config.JWT_ACCESS_EXPIRES_IN as string,
        );

        const refreshToken = createToken(
            jwtPayload,
            config.JWT_REFRESH_SECRET as string,
            config.JWT_REFRESH_EXPIRES_IN as string,
        );


        return {
            user: {
                _id: user[0]._id,
                email: user[0].email,
                userName: user[0].userName,
                limit: user[0].limit,
                rootFolderID: newRootFolder[0]._id,
            },
            accessToken,
            refreshToken
        };
    } catch (error) {

        await session.abortTransaction();

        throw new AppError(
            httpStatus.BAD_REQUEST,
            (error as Error).message || 'An unknown error occurred',
            (error as Error)?.stack,
        );
    } finally {

        await session.endSession();
    }
}

const login = async (payload: TLoginUser) => {
    // check if the userExist
    const user = await User.isUserExistsByEmail(payload.email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // checking if the user is already deleted
    const isDeleted = user.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }
    //checking if the password is correct
    if (user?.password && !(await User.isPasswordMatched(payload.password, user.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password is not correct');
    }


    const jwtPayload = {
        email: user.email,
        rootFolder: user.rootFolderID
    };
    const accessToken = createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET as string,
        config.JWT_ACCESS_EXPIRES_IN as string,
    );

    const refreshToken = createToken(
        jwtPayload,
        config.JWT_REFRESH_SECRET as string,
        config.JWT_REFRESH_EXPIRES_IN as string,
    );


    return {
        user: {
            _id: user._id,
            email: user.email,
            userName: user.userName,
            limit: user.limit,
            rootFolderID: user.rootFolderID,
        },
        accessToken,
        refreshToken
    };


};

const changePassword = async (
    userData: JwtPayload,
    payload: { oldPassword: string; newPassword: string },
) => {
    // check if the userExist
    const user = await User.isUserExistsByEmail(userData.email);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }

    //checking if the old password is correcttly matched with db password
    if (user.password && !(await User.isPasswordMatched(payload.oldPassword, user?.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'old Password is not correct');
    }

    await UpdatePassword(user._id, payload.newPassword);
    return null;
};

const getAccessToken = async (token: string) => {

    if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthrized access');
    }

    const decoded = jwt.verify(
        token,
        config.JWT_REFRESH_SECRET as string,
    ) as JwtPayload;

    const { email, iat } = decoded;

    const user = await User.isUserExistsByEmail(email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // checking if the user is already deleted
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }


    //check if the token is generated before the  password has changed
    if (
        user?.passwordChangedAt &&
        User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat as number)
    ) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'You are not authorized. Log in Again',
        );
    }


    const jwtPayload = {
        email: user.email,
        rootFolder: user.rootFolderID
    };
    const accessToken = createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET as string,
        config.JWT_ACCESS_EXPIRES_IN as string,
    );

    return {
        accessToken,
    };
};

const forgetPassword = async (email: string) => {
    const user = await User.isUserExistsByEmail(email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // checking if the user is already deleted
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }

    const currentTime = new Date();
    const OTPExpiresAt = user.verificationInfo?.OTPExpiresAt;

    if (OTPExpiresAt && currentTime < OTPExpiresAt) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'OTP already generated recently',
        );
    }

    const OTP = generateOTP(6);

    const newOTPExpiresAt = new Date();
    newOTPExpiresAt.setMinutes(newOTPExpiresAt.getMinutes() + 5);

    const updatedUser = await User.updateOne(
        { email: user.email },
        {
            $set: {
                'verificationInfo.OTP': OTP,
                'verificationInfo.OTPExpiresAt': newOTPExpiresAt,
                'verificationInfo.OTPUsed': false,
            },
        }
    );

    if (updatedUser.modifiedCount === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update OTP');
    }

    //send otp to the email of the user
    const OTPmail = `Your OTP for changing password is ${OTP}. Please verify in 5 minutes`;

    await sendEmail(user.email, OTPmail);

    return null;
};

const verifyOTP = async (email: string, OTP: string) => {

    const user = await User.isUserExistsByEmail(email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // checking if the user is already deleted
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }

    if (!User.isOTPVerified(
        OTP,
        user?.verificationInfo?.OTP,
        user?.verificationInfo?.OTPExpiresAt,
        user?.verificationInfo?.OTPUsed,
    )) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'OTP verification failed',
        );
    }

    const jwtPayload = {
        email: user.email
    };
    const token = createVerifyUserToken(
        jwtPayload,
        config.JWT_VERIFIED_USER_SECRET as string,
        '60m',
    );
    return {
        token,

    }
}

const resetPassword = async (token: string, password: string) => {

    if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthrized');
    }

    const decoded = jwt.verify(
        token,
        config.JWT_VERIFIED_USER_SECRET as string,
    ) as JwtPayload;

    const { email } = decoded;

    const user = await User.isUserExistsByEmail(email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // checking if the user is already deleted
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }
    await UpdatePassword(user._id, password);

    const updateResult = await User.updateOne(
        { _id: user._id },
        {
            $unset: { verificationInfo: 1 },
        }
    );

    if (!updateResult.matchedCount || !updateResult.modifiedCount) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Failed to remove verification information');
    }

    return null;

};

const createPinForSecureFolder = async (userData: JwtPayload, PIN: string) => {

    // check if the userExist
    const user = await User.isUserExistsByEmail(userData.email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    // checking if the user is already deleted
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }

    if (user.secureFolderPin || user.securedrootFolderID) {
        throw new AppError(httpStatus.CONFLICT, 'Pin and folder Already Created')
    }


    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const securefolderData = {
            userID: user._id,
            folderName: 'Secured Folder',
            access: [user._id],
            isSecured: true
        }
        // Create the secured root folder
        const securedRootFolder = await FolderModel.create([securefolderData], { session });

        if (!securedRootFolder.length) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create secured Root folder');
        }

        const HashedPin = await bcrypt.hash(
            PIN,
            Number(config.bcrypt_salt_round),
        );
        //Update the user with rootFolderID
        const updateResult = await User.updateOne(
            { _id: user._id },
            {
                securedrootFolderID: securedRootFolder[0]._id,
                secureFolderPin: HashedPin

            },
            { session }
        );

        if (!updateResult.matchedCount || !updateResult.modifiedCount) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Failed to associate root folder with user');
        }


        await session.commitTransaction();



        return null;
    } catch (error) {

        await session.abortTransaction();

        throw new AppError(
            httpStatus.BAD_REQUEST,
            (error as Error).message || 'An unknown error occurred',
            (error as Error)?.stack,
        );
    } finally {

        await session.endSession();
    }

}

const LoginToSecureFolder = async (userData: JwtPayload, PIN: string) => {

    // check if the userExist
    const user = await User.isUserExistsByEmail(userData.email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // checking if the user is already deleted
    const isDeleted = user.isDeleted;
    if (isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User is already removed from system',
        );
    }

    if (!user.secureFolderPin || !user.securedrootFolderID) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Pin and secure folder are not created')
    }

    //checking if the password is correct
    if (user?.password && !(await User.isPasswordMatched(PIN, user.secureFolderPin))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password is not correct');
    }


    const jwtPayload = {
        email: user.email,
        securedrootFolderID: user.securedrootFolderID
    };

    const accessToken = createSecuredFolderToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET as string,
        config.JWT_ACCESS_EXPIRES_IN as string,
    );
    return {
        securedrootFolderID: user.securedrootFolderID,
        accessToken,
    };


};

const changeNameIntoDB = async (userData: JwtPayload, name: string) => {

    const user = await User.findOneAndUpdate(
        {
            email: userData.email,
        },
        {
            userName: name,
        },
        {
            new: true
        }
    );
    return user;
}
const getMyProfile = async (email: string) => {

    const user = await User.findOne({ email })

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }


    const sizesByType = await FileModel.aggregate([
        { $match: { userID: user._id } },
        {
            $group: {
                _id: '$dataType',
                totalSize: { $sum: '$fileSize' },
            },
        },
    ]);

    let totalUsedFromLimit = 0
    const storageUsageByType = sizesByType.reduce((acc, { _id, totalSize }) => {
        acc[_id] = totalSize;
        totalUsedFromLimit += totalSize
        return acc;
    }, {} as Record<string, number>);

    const remainingStorage = user.limit - totalUsedFromLimit;

    const recentFolders = await FolderModel.find({userID : user._id,isSecured:false}).sort({ updatedAt: -1 }).limit(8); 
    const recentFiles = await FileModel.find({userID : user._id,isSecured:false}).sort({ updatedAt: -1 }).limit(8);
    const combinedResults = [...recentFolders, ...recentFiles] ;
    const sortedResults = combinedResults.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); 
    });
    const recent = sortedResults.slice(0, 8);
    return {
        user,
        storageUsageByType,
        remainingStorage,
        recent
    };
};
export const UserServices = {
    SignUp,
    login,
    googleAuth,
    changePassword,
    getAccessToken,
    forgetPassword,
    verifyOTP,
    resetPassword,
    changeNameIntoDB,
    createPinForSecureFolder,
    LoginToSecureFolder,
    getMyProfile
}