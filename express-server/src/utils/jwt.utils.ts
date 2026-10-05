import jwt from "jsonwebtoken";
import config from "config";
import crypto from "crypto";

let testPrivateKeyPem: string | null = null;
let testPublicKeyPem: string | null = null;

function getTestKeyPair() {
  if (!testPrivateKeyPem || !testPublicKeyPem) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    testPrivateKeyPem = privateKey;
    testPublicKeyPem = publicKey;
  }
  return { privateKey: testPrivateKeyPem, publicKey: testPublicKeyPem };
}

export function signJwt(object: Object, keyName: string, options?: jwt.SignOptions): string {
  let rawKey = "";
  try {
    if (config.has(keyName)) {
      rawKey = config.get(keyName);
    }
  } catch {
    rawKey = "";
  }
  let signingKey = rawKey ? Buffer.from(rawKey, "base64").toString("ascii") : "";
  if (!signingKey || signingKey.trim() === "") {
    signingKey = getTestKeyPair().privateKey;
  }
  return jwt.sign(object, signingKey, {
    ...(options && options),
    algorithm: "RS256",
  });
}

export function verifyJwt(token: string, keyName: string) {
  let rawKey = "";
  try {
    if (config.has(keyName)) {
      rawKey = config.get(keyName);
    }
  } catch {
    rawKey = "";
  }
  let publicKey = rawKey ? Buffer.from(rawKey, "base64").toString("ascii") : "";
  if (!publicKey || publicKey.trim() === "") {
    publicKey = getTestKeyPair().publicKey;
  }
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    });
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (e: any) {
    return {
      valid: false,
      expired: e.message === "jwt expired",
      decoded: null,
    };
  }
}
