import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  reorderProductImages,
  setPrimaryImage,
} from "../controllers/productController.js";
import upload from "../middleware/uploadMiddleware.js"; // Use your real upload middleware

const router = express.Router();

// This handles multipart/form-data for image uploads
const productUpload = upload.fields([
  { name: "images", maxCount: 10 },
  // Add fields for variant images if your controller supports it
  // { name: "variant_0_images", maxCount: 5 },
  // { name: "variant_1_images", maxCount: 5 },
]);

router.route("/").get(getProducts).post(productUpload, createProduct);

router
  .route("/:id")
  .get(getProduct)
  .put(productUpload, updateProduct)
  .delete(deleteProduct);

router.route("/:id/images/reorder").put(reorderProductImages);
router.route("/:id/images/set-primary").put(setPrimaryImage);

export default router;
