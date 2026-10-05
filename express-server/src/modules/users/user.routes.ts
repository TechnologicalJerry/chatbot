import { Router } from "express";
import { createUserHandler } from "./user.controller";
import validateResource from "../../middleware/validation/validateResource";
import { createUserSchema } from "./user.schema";

const router = Router();

router.post("/", validateResource(createUserSchema), createUserHandler);

export default router;
