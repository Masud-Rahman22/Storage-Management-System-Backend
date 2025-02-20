"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createVerifyUserToken = exports.createSecuredFolderToken = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createToken = (jwtPayload, secret, expiresIn) => {
    return jsonwebtoken_1.default.sign(jwtPayload, secret, { expiresIn: expiresIn });
};
exports.createToken = createToken;
const createSecuredFolderToken = (jwtPayload, secret, expiresIn) => {
    return jsonwebtoken_1.default.sign(jwtPayload, secret, { expiresIn: expiresIn });
};
exports.createSecuredFolderToken = createSecuredFolderToken;
const createVerifyUserToken = (jwtPayload, secret, expiresIn) => {
    return jsonwebtoken_1.default.sign(jwtPayload, secret, { expiresIn: expiresIn });
};
exports.createVerifyUserToken = createVerifyUserToken;
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
