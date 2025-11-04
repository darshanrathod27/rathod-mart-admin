import express from "express";
import {
  getSizeMappings,
  getSizeMapping,
  createSizeMapping,
  updateSizeMapping,
  deleteSizeMapping,
  getSizeMappingsByProduct,
} from "../controllers/productSizeMappingController.js";

const router = express.Router();

router.route("/").get(getSizeMappings).post(createSizeMapping);

router.route("/product/:productId").get(getSizeMappingsByProduct);

router
  .route("/:id")
  .get(getSizeMapping)
  .put(updateSizeMapping)
  .delete(deleteSizeMapping);

export default router;
