// backend/routes/reviewRoutes.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import {
  createReview,
  getReviewsForProduct,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

// Validation middleware (aapke style jaisa)
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true });
  const err = new Error(first.map((e) => `${e.path}: ${e.msg}`).join(", "));
  err.statusCode = 422;
  next(err);
};

const createReviewRules = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  body("rating")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }),
  body("userName").optional().trim().isLength({ max: 100 }),
];

const statusUpdateRules = [
  param("reviewId").isMongoId().withMessage("Invalid review ID"),
  body("status")
    .isIn(["Approved", "Rejected", "Pending"])
    .withMessage("Invalid status value"),
];

const idParamRule = [param("reviewId").isMongoId().withMessage("Invalid ID")];
const productIdParamRule = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
];

// --- Public Routes (For Customer Frontend) ---

// GET /api/reviews/:productId - Get all approved reviews for a product
router.get("/:productId", productIdParamRule, validate, getReviewsForProduct);

// POST /api/reviews/:productId - Create a new review for a product
router.post("/:productId", createReviewRules, validate, createReview);

// --- Admin Routes (For Admin Panel) ---

// GET /api/reviews - Get all reviews (paginated, filterable)
router.get("/", getAllReviews); // Assume admin auth middleware yahan lagega

// PUT /api/reviews/:reviewId/status - Approve/Reject a review
router.put(
  "/:reviewId/status",
  statusUpdateRules,
  validate,
  updateReviewStatus
);

// DELETE /api/reviews/:reviewId - Delete a review
router.delete("/:reviewId", idParamRule, validate, deleteReview);

export default router;
