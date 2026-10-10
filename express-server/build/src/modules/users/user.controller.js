"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserHandler = void 0;
const user_service_1 = require("./user.service");
const logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
async function createUserHandler(req, res) {
    try {
        const user = await (0, user_service_1.createUser)(req.body);
        return res.send(user);
    }
    catch (e) {
        logger_1.default.error(e);
        return res.status(409).send(e.message);
    }
}
exports.createUserHandler = createUserHandler;
