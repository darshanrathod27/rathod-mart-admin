// backend/routes/wishlistRoutes.js
import express from "express";
import {
  getWishlist,
  addItemToWishlist,
  removeItemFromWishlist,
  mergeWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All wishlist routes are protected and require a user to be logged in
router.use(protect);

router.route("/").get(getWishlist);
router.route("/add").post(addItemToWishlist);
router.route("/remove").post(removeItemFromWishlist);
router.route("/merge").post(mergeWishlist);

export default router;
