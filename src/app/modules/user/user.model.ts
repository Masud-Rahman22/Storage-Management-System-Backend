import { model, Schema } from "mongoose";
import { TUser, TUserVerificationInfo, UserModel } from "./user.interface";
import config from '../../config';
import bcrypt from 'bcrypt';
const UserVerificationInfoSchema = new Schema<TUserVerificationInfo>(
    {
        OTP: {
            type: String,
            required: true,
        },
        OTPExpiresAt: {
            type: Date,
            required: true,
        },
        OTPUsed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
)

const userSchema = new Schema<TUser>(
    {

        userName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            select: 0,
        },
        passwordChangedAt: {
            type: Date,
        },
        rootFolderID: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
        },
        securedrootFolderID: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
        },
        secureFolderPin: {
            type: String,
            select: 0,
        },
        verificationInfo: UserVerificationInfoSchema,
        limit: {
            type: Number,
            default: 15 * 1024 * 1024 * 1024,
        },

    },
    {
        timestamps: true,
    },
)
// Pre save middleware / hook : will work on create() save()
userSchema.pre('save', async function (next) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const user = this;

    // Hash password 
    if (user.password) {
        user.password = await bcrypt.hash(
            user.password,
            Number(config.bcrypt_salt_round)
        );
    }

    // Hash secureFolderPin 
    if (user.secureFolderPin) {
        user.secureFolderPin = await bcrypt.hash(
            user.secureFolderPin,
            Number(config.bcrypt_salt_round)
        );
    }


    next();
});

//post middleware /hook
userSchema.post('save', function (doc, next) {
    doc.password = '';
    if (doc.verificationInfo) {
        doc.verificationInfo.OTP = '';
    }
    doc.secureFolderPin = '';
    next();
});

userSchema.statics.isUserExistsByEmail = async function (email: string) {
    return await User.findOne({ email }).select('+password +secureFolderPin');
};

userSchema.statics.isOTPVerified = async function (
    OTP: string,
    SavedOTP: string,
    OTPExpiresAt: Date,
    OTPUsed: boolean
) {
    if (new Date() > OTPExpiresAt || OTPUsed) {
        return false;
    }
    return OTP === SavedOTP;
};

userSchema.statics.isPasswordMatched = async function (
    plainTextPassword: string,
    hashPassword: string,
) {
    return await bcrypt.compare(plainTextPassword, hashPassword);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
    passwordChangedAt: Date,
    JwtIssuedTimeStamp: number,
) {
    const passwordChangedTime = new Date(passwordChangedAt).getTime() / 1000;
    return passwordChangedTime > JwtIssuedTimeStamp;
};

export const User = model<TUser, UserModel>('User', userSchema);