// backend/routes/wishlistRoutes.js
import express from "express";
import {
  getWishlist,
  addItemToWishlist,
  removeItemFromWishlist,
  mergeWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js"; // Uses customer 'protect'

const router = express.Router();

// All wishlist routes are protected
router.use(protect); // <-- This now correctly refers to the customer-only middleware

router.route("/").get(getWishlist);
router.route("/add").post(addItemToWishlist);
router.route("/remove").post(removeItemFromWishlist);
router.route("/merge").post(mergeWishlist);

export default router;
