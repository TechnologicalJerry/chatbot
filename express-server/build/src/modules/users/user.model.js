"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("config"));
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
}, {
    timestamps: true,
});
userSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }
    const saltWorkFactor = config_1.default.has("saltWorkFactor") ? config_1.default.get("saltWorkFactor") : 10;
    const salt = await bcrypt_1.default.genSalt(saltWorkFactor);
    const hash = await bcrypt_1.default.hash(user.password, salt);
    user.password = hash;
    return next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    const user = this;
    return bcrypt_1.default.compare(candidatePassword, user.password).catch(() => false);
};
exports.UserModel = mongoose_1.default.model("User", userSchema);
exports.default = exports.UserModel;
