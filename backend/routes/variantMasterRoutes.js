// backend/routes/variantMasterRoutes.js
import express from "express";
import {
  getVariants,
  getVariant,
  createVariant,
  updateVariant,
  deleteVariant,
  getVariantsByProduct,
} from "../controllers/variantMasterController.js";

const router = express.Router();

router.route("/").get(getVariants).post(createVariant);
router.route("/product/:productId").get(getVariantsByProduct);
router.route("/:id").get(getVariant).put(updateVariant).delete(deleteVariant);

export default router;
