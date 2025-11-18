// backend/routes/categoryRoutes.js
import express from "express";
import { body, param, validationResult } from "express-validator";

// Auth middlewares for protected/admin routes
import { protect, admin } from "../middleware/authMiddleware.js";

// Controller functions (including recountAllCategories and fixCategoryIcons)
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  recountAllCategories,
  fixCategoryIcons, // <-- newly added
} from "../controllers/categoryController.js";

const router = express.Router();

// tiny validator middleware
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true });
  const err = new Error(first.map((e) => `${e.path}: ${e.msg}`).join(", "));
  err.statusCode = 422;
  next(err);
};

// Validation rules
const createRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name required")
    .isLength({ max: 100 }),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description required")
    .isLength({ max: 500 }),
  body("status").optional().isIn(["Active", "Inactive"]),
];

const updateRules = [
  param("id").isMongoId().withMessage("Invalid category id"),
  body("name").optional().trim().notEmpty().isLength({ max: 100 }),
  body("description").optional().trim().notEmpty().isLength({ max: 500 }),
  body("status").optional().isIn(["Active", "Inactive"]),
];

// Public list/search/paginate/sort/filter
// Example query params: page, limit, search, status, sortBy, sortOrder, dateFrom, dateTo
router.get("/", getCategories);

// Admin-only: recount all category product counts (repair/fix route)
router.get(
  "/admin/recount-all",
  protect, // user must be authenticated
  admin, // user must be admin
  recountAllCategories
);

// Admin-only: fix all category icons/colors
router.get("/admin/fix-icons", protect, admin, fixCategoryIcons);

// Create
router.post("/", createRules, validate, createCategory);

// Read single
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid category id")],
  validate,
  getCategory
);

// Update
router.put("/:id", updateRules, validate, updateCategory);

// Delete (soft)
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid category id")],
  validate,
  deleteCategory
);

export default router;
