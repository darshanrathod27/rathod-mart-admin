// backend/routes/productSizeMappingRoutes.js
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

router.get("/", getSizeMappings);
router.post("/", createSizeMapping);
router.get("/product/:productId", getSizeMappingsByProduct);
router.get("/:id", getSizeMapping);
router.put("/:id", updateSizeMapping);
router.delete("/:id", deleteSizeMapping);

export default router;
