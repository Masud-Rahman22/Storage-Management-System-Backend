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
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const globalErrorHandler_1 = require("./middlewares/globalErrorHandler");
const notFound_1 = require("./middlewares/notFound");
const routes_1 = __importDefault(require("./routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./middlewares/auth");
const app = (0, express_1.default)();
//parser
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173/'],
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
/*---------------- MIDDLEWARES -----------------------*/
// app.use(logger)
/*------------ APPLICATION ROUTES -------------------*/
app.use('/', routes_1.default);
app.use('/uploads', (0, auth_1.auth)(), express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
/*------------ Test route -------------------*/
const test = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send('server is RUNNIG !!! 😎😎😎');
});
app.get('/', test);
/**------------ GLOBAL ERROR HANDLER -------------------*/
app.use(globalErrorHandler_1.globalErrorHandler);
/** ------------ NOT FOUND URL ------------------- */
app.use(notFound_1.notFound);
exports.default = app;
