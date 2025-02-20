"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const loginWithGoogleValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        tokenId: zod_1.z.string({ required_error: 'Token is required' }),
    }),
});
const loginValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }),
        password: zod_1.z.string({ required_error: 'Password is required' }),
    }),
});
const SignUpByEmailAndPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userName: zod_1.z.string({ required_error: "Name is required" }),
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z
            .string({
            invalid_type_error: 'Password must be string',
        })
            .min(6, { message: 'password must be at least 6 character' })
    })
});
const ChangePasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        oldPassword: zod_1.z.string({ required_error: 'Old Password is required' }),
        newPassword: zod_1.z.string({ required_error: 'New Password is required' }),
    }),
});
const ChangeNameValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userName: zod_1.z.string({ required_error: 'Name is required' }),
    }),
});
const getAccessTokenByRefreshTokenValidationSchema = zod_1.z.object({
    cookies: zod_1.z.object({
        refreshToken: zod_1.z.string({ required_error: 'refresh token is required' }),
    }),
});
const forgetPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }),
    }),
});
const verifyOTPValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }),
        OTP: zod_1.z.string({ required_error: 'OTP is required' })
    }),
});
const resetPasswordValidationSchema = zod_1.z.object({
    cookies: zod_1.z.object({
        verifiedUser: zod_1.z.string({ required_error: 'verification token is required' }),
    }),
    body: zod_1.z.object({
        newPassword: zod_1.z.string({ required_error: 'Password is required' }),
    }),
});
const PinValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        PIN: zod_1.z.string({ required_error: 'Pin is required' })
    }),
});
exports.UserValidation = {
    SignUpByEmailAndPasswordValidationSchema,
    loginValidationSchema,
    getAccessTokenByRefreshTokenValidationSchema,
    forgetPasswordValidationSchema,
    ChangePasswordValidationSchema,
    loginWithGoogleValidationSchema,
    verifyOTPValidationSchema,
    resetPasswordValidationSchema,
    PinValidationSchema,
    ChangeNameValidationSchema,
};
