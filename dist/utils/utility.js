"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = void 0;
const generateOTP = (length) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
};
exports.generateOTP = generateOTP;
