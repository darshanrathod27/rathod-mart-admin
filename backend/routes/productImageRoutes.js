import express from "express";
import {
  uploadProductImage,
  getProductImages,
  deleteProductImage,
  updateProductImage,
} from "../controllers/productImageController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router
  .route("/:productId/images")
  .post(upload.single("image"), uploadProductImage) // 'image' frontend form field ka naam hai
  .get(getProductImages);

router
  .route("/images/:imageId")
  .delete(deleteProductImage)
  .put(updateProductImage); // Update ke liye abhi file upload nahi hai

export default router;
