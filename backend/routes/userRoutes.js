// backend/routes/userRoutes.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import { uploadProfile } from "../middleware/imageUpload.js";
import { protect, admin } from "../middleware/authMiddleware.js"; // 1. Import middleware
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser, // 2. Import new controllers
  registerUser,
  logoutUser,
  getUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

// inline validate middleware (Keep as is)
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true });
  const err = new Error(first.map((e) => `${e.path}: ${e.msg}`).join(", "));
  err.statusCode = 422;
  next(err);
};

// Rules (Keep as is)
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

// --- 3. Add New Public Auth Routes ---
router.post("/login", loginUser);
router.post("/register", registerUser); // For customer sign-up
router.post("/logout", logoutUser); // Needs 'protect' if you only want logged-in users to logout
router.get("/profile", protect, getUserProfile); // Get logged-in user's profile

// --- 4. Protect Admin Routes ---
// list/search/paginate
router.get("/", protect, admin, getUsers);

// create (accept multipart image)
router.post(
  "/",
  protect,
  admin,
  uploadProfile,
  createUserRules,
  validate,
  createUser
);

// read
router.get("/:id", protect, admin, idParamRule, validate, getUserById);

// update (accept multipart image)
router.put(
  "/:id",
  protect,
  admin,
  uploadProfile,
  updateUserRules,
  validate,
  updateUser
);

// delete
router.delete("/:id", protect, admin, idParamRule, validate, deleteUser);

export default router;
