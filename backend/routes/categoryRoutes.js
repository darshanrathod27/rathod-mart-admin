import express from "express";
import { body } from "express-validator";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} from "../controllers/categoryController.js";

const router = express.Router();

// Validation rules
const createCategoryValidation = [
  body("name")
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Description must be between 5 and 500 characters"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Invalid status"),
];

const updateCategoryValidation = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage("Description must be between 5 and 500 characters"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Invalid status"),
];

// Routes
router
  .route("/")
  .get(getCategories)
  .post(createCategoryValidation, createCategory);

router.route("/stats").get(getCategoryStats);

router
  .route("/:id")
  .get(getCategory)
  .put(updateCategoryValidation, updateCategory)
  .delete(deleteCategory);

export default router;
