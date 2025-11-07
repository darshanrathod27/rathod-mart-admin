// backend/routes/productColorMappingRoutes.js
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

router.get("/", getColorMappings);
router.post("/", createColorMapping);
router.get("/product/:productId", getColorMappingsByProduct);
router.get("/:id", getColorMapping);
router.put("/:id", updateColorMapping);
router.delete("/:id", deleteColorMapping);

export default router;
