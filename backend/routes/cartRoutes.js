// backend/routes/cartRoutes.js
import express from "express";
import {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All cart routes are protected
router.use(protect);

router.route("/").get(getCart);
router.route("/add").post(addItemToCart);
router.route("/update").post(updateItemQuantity);
router.route("/remove").post(removeItemFromCart);
router.route("/clear").post(clearCart);
router.route("/merge").post(mergeCart);

export default router;
