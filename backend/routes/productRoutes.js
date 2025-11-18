// routes/productRoutes.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import createMulterForFolder from "../middleware/uploadMiddleware.js";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  reorderImages,
  setPrimaryImage,
  getProductVariants,
  recalculateStock,
} from "../controllers/productController.js";

const upload = createMulterForFolder("products"); // saves to /uploads/products

const router = express.Router();

// validation result middleware (same style as userRoutes)
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true });
  const err = new Error(first.map((e) => `${e.path}: ${e.msg}`).join(", "));
  err.statusCode = 422;
  next(err);
};

const createRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category").isMongoId().withMessage("Valid category id is required"),
  body("basePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("basePrice must be >= 0"),
  body("status")
    .optional()
    .isIn(["active", "inactive", "draft", "archived"])
    .withMessage("Invalid status"),
];

const updateRules = [
  param("id").isMongoId().withMessage("Invalid product id"),
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim().notEmpty(),
  body("category").optional().isMongoId().withMessage("Invalid category id"),
  body("basePrice").optional().isFloat({ min: 0 }),
  body("status").optional().isIn(["active", "inactive", "draft", "archived"]),
];

// list/search/paginate
router.get("/", getProducts);

// create (accept multipart images[])
// fields: images[]
router.post(
  "/",
  upload.array("images", 15),
  createRules,
  validate,
  createProduct
);

// read
router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid product id"),
  validate,
  getProduct
);

// update (accept multipart images[] and body.deleteFilenames (JSON array or CSV))
// also supports setting tags/features as JSON array or CSV strings
router.put(
  "/:id",
  upload.array("images", 15),
  updateRules,
  validate,
  updateProduct
);

// delete
router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid product id"),
  validate,
  deleteProduct
);

// reorder images
router.put(
  "/:id/images/reorder",
  param("id").isMongoId().withMessage("Invalid product id"),
  body("imageFilenames").isArray().withMessage("imageFilenames must be array"),
  validate,
  reorderImages
);

// set primary
router.put(
  "/:id/images/primary",
  param("id").isMongoId().withMessage("Invalid product id"),
  body("filename").notEmpty().withMessage("filename is required"),
  validate,
  setPrimaryImage
);

// get variants (if any)
router.get(
  "/:id/variants",
  param("id").isMongoId().withMessage("Invalid product id"),
  validate,
  getProductVariants
);

// recalculate totalStock from Variant/Inventory models (if present)
router.put(
  "/:id/recalculate-stock",
  param("id").isMongoId().withMessage("Invalid product id"),
  validate,
  recalculateStock
);

export default router;
