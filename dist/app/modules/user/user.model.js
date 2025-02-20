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
exports.User = void 0;
const mongoose_1 = require("mongoose");
const config_1 = __importDefault(require("../../config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserVerificationInfoSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
const userSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Folder',
    },
    securedrootFolderID: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Pre save middleware / hook : will work on create() save()
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const user = this;
        // Hash password 
        if (user.password) {
            user.password = yield bcrypt_1.default.hash(user.password, Number(config_1.default.bcrypt_salt_round));
        }
        // Hash secureFolderPin 
        if (user.secureFolderPin) {
            user.secureFolderPin = yield bcrypt_1.default.hash(user.secureFolderPin, Number(config_1.default.bcrypt_salt_round));
        }
        next();
    });
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
userSchema.statics.isUserExistsByEmail = function (email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.User.findOne({ email }).select('+password +secureFolderPin');
    });
};
userSchema.statics.isOTPVerified = function (OTP, SavedOTP, OTPExpiresAt, OTPUsed) {
    return __awaiter(this, void 0, void 0, function* () {
        if (new Date() > OTPExpiresAt || OTPUsed) {
            return false;
        }
        return OTP === SavedOTP;
    });
};
userSchema.statics.isPasswordMatched = function (plainTextPassword, hashPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(plainTextPassword, hashPassword);
    });
};
userSchema.statics.isJWTIssuedBeforePasswordChanged = function (passwordChangedAt, JwtIssuedTimeStamp) {
    const passwordChangedTime = new Date(passwordChangedAt).getTime() / 1000;
    return passwordChangedTime > JwtIssuedTimeStamp;
};
exports.User = (0, mongoose_1.model)('User', userSchema);
