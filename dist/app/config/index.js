"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
exports.default = {
    PORT: process.env.PORT,
    database_URL: process.env.DATABASE_URL,
    bcrypt_salt_round: process.env.BCRYPT_SALT_ROUND,
    NODE_ENV: process.env.NODE_ENV,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_VERIFIED_USER_SECRET: process.env.JWT_VERIFIED_USER_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    RESET_PASSWORD_URI: process.env.RESET_PASSWORD_URI,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    SERVER_URL: process.env.SERVER_URL,
};
