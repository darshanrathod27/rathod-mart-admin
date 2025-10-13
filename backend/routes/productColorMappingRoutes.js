import express from "express";
import {
  getColorMappings,
  getColorMapping,
  createColorMapping,
  updateColorMapping,
  deleteColorMapping,
  getColorMappingsByProduct,
} from "../controllers/productColorMappingController.js";

const router = express.Router();

router.route("/").get(getColorMappings).post(createColorMapping);
router.route("/product/:productId").get(getColorMappingsByProduct);
router
  .route("/:id")
  .get(getColorMapping)
  .put(updateColorMapping)
  .delete(deleteColorMapping);

export default router;
