// backend/routes/promocodeRoutes.js
import express from "express";
import {
  getPromocodes,
  getPromocodeById,
  createPromocode,
  updatePromocode,
  deletePromocode,
} from "../controllers/promocodeController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here are protected and for admins
router.use(protectAdmin, admin);

router.route("/").get(getPromocodes).post(createPromocode);
router
  .route("/:id")
  .get(getPromocodeById)
  .put(updatePromocode)
  .delete(deletePromocode);

export default router;
