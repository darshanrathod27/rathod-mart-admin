// backend/routes/promocodeRoutes.js
import express from "express";
import {
  validatePromocode,
  createPromocode,
  getAllPromocodes,
  getPromocode,
  updatePromocode,
  deletePromocode,
} from "../controllers/promocodeController.js";
import { protect, protectAdmin, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Customer Route ---
router.post("/validate", protect, validatePromocode);

// --- Admin Routes ---
router.use(protectAdmin, admin);

router.route("/").post(createPromocode).get(getAllPromocodes);

router
  .route("/:id")
  .get(getPromocode)
  .put(updatePromocode)
  .delete(deletePromocode);

export default router;
