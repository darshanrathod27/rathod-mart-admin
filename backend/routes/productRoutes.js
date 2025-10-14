import express from "express";
import { body } from "express-validator";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getProductsByCategory,
} from "../controllers/productController.js";
import productImageRoutes from "./productImageRoutes.js"; // **FIX:** Import image routes

const router = express.Router();

// --- Validation Rules (No change) ---
const createProductValidation = [
  body("name", "Product name must be between 2 and 200 characters").isLength({
    min: 2,
    max: 200,
  }),
  body(
    "description",
    "Description must be between 10 and 1000 characters"
  ).isLength({ min: 10, max: 1000 }),
  body("category", "A valid category is required").isMongoId(),
  body("originalPrice", "Price must be a number greater than 0")
    .isFloat({ gt: 0 })
    .toFloat(),
];
const updateProductValidation = [
  body("name", "Product name must be between 2 and 200 characters")
    .optional()
    .isLength({ min: 2, max: 200 }),
  body("category", "Invalid category ID").optional().isMongoId(),
  body("originalPrice", "Price must be a number greater than 0")
    .optional()
    .isFloat({ gt: 0 })
    .toFloat(),
];

// --- Main Product Routes ---
router.route("/").get(getProducts).post(createProductValidation, createProduct);
router.route("/stats").get(getProductStats);
router.route("/category/:categoryId").get(getProductsByCategory);
router
  .route("/:id")
  .get(getProduct)
  .put(updateProductValidation, updateProduct)
  .delete(deleteProduct);

// --- Nested Image Routes ---
// **FIX:** This correctly nests the image routes under `/api/products`
router.use("/", productImageRoutes);

export default router;
