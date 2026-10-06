import { Request, Response } from "express";
import config from "config";
import { createSession, findSessions, updateSession } from "./session.service";
import { validatePassword } from "../users/user.service";
import { signJwt } from "../../utils/jwt.utils";

export async function createUserSessionHandler(req: Request, res: Response) {
  const user = await validatePassword(req.body);

  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  const session = await createSession(user._id.toString(), req.get("user-agent") || "");

  const accessTokenTtl = config.has("accessTokenTtl") ? config.get<string>("accessTokenTtl") : "15m";
  const refreshTokenTtl = config.has("refreshTokenTtl") ? config.get<string>("refreshTokenTtl") : "1y";

  const accessToken = signJwt(
    { ...user, session: session._id },
    "accessTokenPrivateKey",
    { expiresIn: accessTokenTtl }
  );

  const refreshToken = signJwt(
    { ...user, session: session._id },
    "refreshTokenPrivateKey",
    { expiresIn: refreshTokenTtl }
  );

  return res.send({ accessToken, refreshToken });
}

export async function getUserSessionsHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;
  const sessions = await findSessions({ user: userId, valid: true });
  return res.send(sessions);
}

export async function deleteSessionHandler(req: Request, res: Response) {
  const sessionId = res.locals.user.session;
  await updateSession({ _id: sessionId }, { valid: false });

  return res.send({
    accessToken: null,
    refreshToken: null,
  });
}
