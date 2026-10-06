import { Request, Response, NextFunction } from "express";
import { get } from "lodash";
import { verifyJwt } from "../../utils/jwt.utils";
import { reIssueAccessToken } from "../../modules/auth/session.service";
import SessionModel from "../../modules/auth/session.model";

export const deserializeUser = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = get(req, "headers.authorization", "").replace(/^Bearer\s/, "");
  const refreshToken = get(req, "headers.x-refresh") as string;

  if (!accessToken) {
    return next();
  }

  const { decoded, expired } = verifyJwt(accessToken, "accessTokenPublicKey");

  if (decoded) {
    // Verify session validity in DB if session ID is in payload
    const sessionId = get(decoded, "session");
    if (sessionId) {
      try {
        const session = await SessionModel.findById(sessionId);
        if (!session || !session.valid) {
          return next();
        }
      } catch {}
    }
    res.locals.user = decoded;
    return next();
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });
    if (newAccessToken) {
      res.setHeader("x-access-token", newAccessToken as string);
      const result = verifyJwt(newAccessToken as string, "accessTokenPublicKey");
      res.locals.user = result.decoded;
    }
    return next();
  }

  return next();
};

export default deserializeUser;
