// backend/routes/cartRoutes.js
import express from "express";
import {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  mergeCart,
  validatePromocode, // 1. Import new controller
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js"; // Uses customer 'protect'

const router = express.Router();

// All cart routes are protected
router.use(protect); // <-- This now correctly refers to the customer-only middleware

router.route("/").get(getCart);
router.route("/add").post(addItemToCart);
router.route("/update").post(updateItemQuantity);
router.route("/remove").post(removeItemFromCart);
router.route("/clear").post(clearCart);
router.route("/merge").post(mergeCart);
router.route("/validate-promo").post(validatePromocode); // 2. Add new route

export default router;
