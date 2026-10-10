"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = exports.signJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("config"));
const crypto_1 = __importDefault(require("crypto"));
let testPrivateKeyPem = null;
let testPublicKeyPem = null;
function getTestKeyPair() {
    if (!testPrivateKeyPem || !testPublicKeyPem) {
        const { privateKey, publicKey } = crypto_1.default.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        testPrivateKeyPem = privateKey;
        testPublicKeyPem = publicKey;
    }
    return { privateKey: testPrivateKeyPem, publicKey: testPublicKeyPem };
}
function signJwt(object, keyName, options) {
    let rawKey = "";
    try {
        if (config_1.default.has(keyName)) {
            rawKey = config_1.default.get(keyName);
        }
    }
    catch {
        rawKey = "";
    }
    let signingKey = rawKey ? Buffer.from(rawKey, "base64").toString("ascii") : "";
    if (!signingKey || signingKey.trim() === "") {
        signingKey = getTestKeyPair().privateKey;
    }
    return jsonwebtoken_1.default.sign(object, signingKey, {
        ...(options && options),
        algorithm: "RS256",
    });
}
exports.signJwt = signJwt;
function verifyJwt(token, keyName) {
    let rawKey = "";
    try {
        if (config_1.default.has(keyName)) {
            rawKey = config_1.default.get(keyName);
        }
    }
    catch {
        rawKey = "";
    }
    let publicKey = rawKey ? Buffer.from(rawKey, "base64").toString("ascii") : "";
    if (!publicKey || publicKey.trim() === "") {
        publicKey = getTestKeyPair().publicKey;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, publicKey, {
            algorithms: ["RS256"],
        });
        return {
            valid: true,
            expired: false,
            decoded,
        };
    }
    catch (e) {
        return {
            valid: false,
            expired: e.message === "jwt expired",
            decoded: null,
        };
    }
}
exports.verifyJwt = verifyJwt;
