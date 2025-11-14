// backend/routes/userRoutes.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import { uploadProfile } from "../middleware/imageUpload.js";
import { protect, protectAdmin, admin } from "../middleware/authMiddleware.js";

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  loginAdminUser, // 1. Import new admin login controller
  registerUser,
  logoutUser,
  logoutAdmin,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

// -------------------- VALIDATION HANDLER --------------------
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true });
  const err = new Error(first.map((e) => `${e.path}: ${e.msg}`).join(", "));
  err.statusCode = 422;
  next(err);
};

// -------------------- RULES (No changes) --------------------
const createUserRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  body("phone").optional().isString().isLength({ max: 20 }),
  body("role").optional().isIn(["admin", "manager", "staff", "customer"]),
  body("status").optional().isIn(["active", "inactive", "blocked"]),
];

const updateUserRules = [
  param("id").isMongoId().withMessage("Invalid user id"),
  body("name").optional().trim().notEmpty(),
  body("email").optional().isEmail().withMessage("Valid email required"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password min 6 chars"),
  body("phone").optional().isString().isLength({ max: 20 }),
  body("role").optional().isIn(["admin", "manager", "staff", "customer"]),
  body("status").optional().isIn(["active", "inactive", "blocked"]),
];

const idParamRule = [param("id").isMongoId().withMessage("Invalid user id")];

// -------------------- PUBLIC AUTH ROUTES --------------------
router.post("/login", loginUser); // Customer login
router.post("/admin-login", loginAdminUser); // 2. Add Admin login route
router.post("/register", registerUser);
router.post("/logout", logoutUser); // Customer logout
router.post("/admin-logout", logoutAdmin); // Admin logout

// -------------------- CUSTOMER PROFILE ROUTES (Protected) --------------------
router
  .route("/profile")
  .get(protect, getUserProfile) // Uses 'protect' (jwt)
  .put(protect, uploadProfile, updateUserProfile);

// -------------------- ADMIN PROFILE ROUTE (Protected Admin) ------------------
router.route("/admin-profile").get(protectAdmin, getUserProfile); // 3. Add Admin profile route (uses 'protectAdmin' and 'admin_jwt')

// -------------------- ADMIN CRUD ROUTES (Protected + Admin Only) --------------------
router
  .route("/")
  .get(protectAdmin, admin, getUsers)
  .post(
    protectAdmin,
    admin,
    uploadProfile,
    createUserRules,
    validate,
    createUser
  );

router
  .route("/:id")
  .get(protectAdmin, admin, idParamRule, validate, getUserById)
  .put(
    protectAdmin,
    admin,
    uploadProfile,
    updateUserRules,
    validate,
    updateUser
  )
  .delete(protectAdmin, admin, idParamRule, validate, deleteUser);

export default router;
