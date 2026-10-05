import { Router } from "express";
import { createMemoryHandler, deleteMemoryHandler, listMemoriesHandler } from "./memory.controller";
import requireUser from "../../middleware/auth/requireUser";
import validateResource from "../../middleware/validation/validateResource";
import { createMemorySchema, deleteMemorySchema } from "./memory.schema";

const router = Router();

router.use(requireUser);

router.get("/", listMemoriesHandler);
router.post("/", validateResource(createMemorySchema), createMemoryHandler);
router.delete("/:memoryId", validateResource(deleteMemorySchema), deleteMemoryHandler);

export default router;
