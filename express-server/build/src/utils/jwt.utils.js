"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = exports.signJwt = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var config_1 = __importDefault(require("config"));
var crypto_1 = __importDefault(require("crypto"));
var testPrivateKeyPem = null;
var testPublicKeyPem = null;
function getTestKeyPair() {
    if (!testPrivateKeyPem || !testPublicKeyPem) {
        var _a = crypto_1.default.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        }), privateKey = _a.privateKey, publicKey = _a.publicKey;
        testPrivateKeyPem = privateKey;
        testPublicKeyPem = publicKey;
    }
    return { privateKey: testPrivateKeyPem, publicKey: testPublicKeyPem };
}
function signJwt(object, keyName, options) {
    var rawKey = "";
    try {
        if (config_1.default.has(keyName)) {
            rawKey = config_1.default.get(keyName);
        }
    }
    catch (_a) {
        rawKey = "";
    }
    var signingKey = rawKey ? Buffer.from(rawKey, "base64").toString("ascii") : "";
    if (!signingKey || signingKey.trim() === "") {
        signingKey = getTestKeyPair().privateKey;
    }
    return jsonwebtoken_1.default.sign(object, signingKey, __assign(__assign({}, (options && options)), { algorithm: "RS256" }));
}
exports.signJwt = signJwt;
function verifyJwt(token, keyName) {
    var rawKey = "";
    try {
        if (config_1.default.has(keyName)) {
            rawKey = config_1.default.get(keyName);
        }
    }
    catch (_a) {
        rawKey = "";
    }
    var publicKey = rawKey ? Buffer.from(rawKey, "base64").toString("ascii") : "";
    if (!publicKey || publicKey.trim() === "") {
        publicKey = getTestKeyPair().publicKey;
    }
    try {
        var decoded = jsonwebtoken_1.default.verify(token, publicKey, {
            algorithms: ["RS256"],
        });
        return {
            valid: true,
            expired: false,
            decoded: decoded,
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
