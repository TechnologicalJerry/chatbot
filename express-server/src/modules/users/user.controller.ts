import { Request, Response } from "express";
import { createUser } from "./user.service";
import logger from "../../infrastructure/logger/logger";

export async function createUserHandler(req: Request, res: Response) {
  try {
    const user = await createUser(req.body);
    return res.send(user);
  } catch (e: any) {
    logger.error(e);
    return res.status(409).send(e.message);
  }
}
