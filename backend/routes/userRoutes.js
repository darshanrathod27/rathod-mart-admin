// routes/userRoutes.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import { uploadProfile } from "../middleware/imageUpload.js";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// inline validate middleware
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true });
  const err = new Error(first.map((e) => `${e.path}: ${e.msg}`).join(", "));
  err.statusCode = 422;
  next(err);
};

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

// list/search/paginate
router.get("/", getUsers);

// create (accept multipart image)
router.post("/", uploadProfile, createUserRules, validate, createUser);

// read
router.get("/:id", idParamRule, validate, getUserById);

// update (accept multipart image)
router.put("/:id", uploadProfile, updateUserRules, validate, updateUser);

// delete
router.delete("/:id", idParamRule, validate, deleteUser);

export default router;
