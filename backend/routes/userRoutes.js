import express from "express";
import { body } from "express-validator";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/userController.js";

const router = express.Router();

// Validation rules
const createUserValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please enter a valid phone number"),
  body("role")
    .optional()
    .isIn(["Customer", "Admin", "Vendor"])
    .withMessage("Invalid role"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Blocked"])
    .withMessage("Invalid status"),
  body("pincode")
    .optional()
    .matches(/^\d{6}$/)
    .withMessage("Please enter a valid 6-digit pincode"),
];

const updateUserValidation = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("phone")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please enter a valid phone number"),
  body("role")
    .optional()
    .isIn(["Customer", "Admin", "Vendor"])
    .withMessage("Invalid role"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Blocked"])
    .withMessage("Invalid status"),
  body("pincode")
    .optional()
    .matches(/^\d{6}$/)
    .withMessage("Please enter a valid 6-digit pincode"),
];

// Routes
router.route("/").get(getUsers).post(createUserValidation, createUser);

router.route("/stats").get(getUserStats);

router
  .route("/:id")
  .get(getUser)
  .put(updateUserValidation, updateUser)
  .delete(deleteUser);

export default router;
