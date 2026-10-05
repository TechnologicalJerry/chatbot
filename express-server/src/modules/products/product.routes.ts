import { Router } from "express";
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  updateProductHandler,
} from "./product.controller";
import validateResource from "../../middleware/validation/validateResource";
import requireUser from "../../middleware/auth/requireUser";
import {
  createProductSchema,
  deleteProductSchema,
  getProductSchema,
  updateProductSchema,
} from "./product.schema";

const router = Router();

router.post("/", [requireUser, validateResource(createProductSchema)], createProductHandler);
router.put("/:productId", [requireUser, validateResource(updateProductSchema)], updateProductHandler);
router.get("/:productId", validateResource(getProductSchema), getProductHandler);
router.delete("/:productId", [requireUser, validateResource(deleteProductSchema)], deleteProductHandler);

export default router;
