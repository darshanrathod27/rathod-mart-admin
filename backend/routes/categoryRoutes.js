// routes/categoryRoutes.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// tiny validator
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true });
  const err = new Error(first.map((e) => `${e.path}: ${e.msg}`).join(", "));
  err.statusCode = 422;
  next(err);
};

// rules
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

// list/search/paginate/sort/filter
router.get("/", getCategories);

// create
router.post("/", createRules, validate, createCategory);

// read
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid category id")],
  validate,
  getCategory
);

// update
router.put("/:id", updateRules, validate, updateCategory);

// delete (soft)
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid category id")],
  validate,
  deleteCategory
);

export default router;
