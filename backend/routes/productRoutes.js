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

const router = express.Router();

// Validation rules
const createProductValidation = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Name must be between 2 and 200 characters"),
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID"),
  body("originalPrice") // Validating originalPrice instead of price
    .notEmpty()
    .withMessage("Original Price is required")
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Price must be greater than 0");
      }
      return true;
    }),
  // FIXED: Made stock optional as it's set to 0 by default on the backend.
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

const updateProductValidation = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage("Name must be between 2 and 200 characters"),
  body("category").optional().isMongoId().withMessage("Invalid category ID"),
];

// Routes
router.route("/").get(getProducts).post(createProductValidation, createProduct);
router.route("/stats").get(getProductStats);
router.route("/category/:categoryId").get(getProductsByCategory);
router
  .route("/:id")
  .get(getProduct)
  .put(updateProductValidation, updateProduct)
  .delete(deleteProduct);

export default router;
