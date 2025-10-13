import ProductImage from "../models/ProductImage.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Upload an image for a product
// @route   POST /api/products/:productId/images
// @access  Public
export const uploadProductImage = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a file");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if any other images exist for this product
  const imageCount = await ProductImage.countDocuments({ product: productId });

  // If this is the first image, set it as primary
  const isPrimary = imageCount === 0;

  const imageUrl = `/uploads/${req.file.filename}`;

  const productImage = await ProductImage.create({
    product: productId,
    imageUrl: imageUrl,
    isPrimary: isPrimary,
  });

  res.status(201).json({
    success: true,
    data: productImage,
    message: "Image uploaded successfully",
  });
});

// @desc    Get all images for a product
// @route   GET /api/products/:productId/images
// @access  Public
export const getProductImages = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const images = await ProductImage.find({ product: productId });
  res.status(200).json({ success: true, data: images });
});

// @desc    Delete a product image
// @route   DELETE /api/products/images/:imageId
// @access  Public
export const deleteProductImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const image = await ProductImage.findById(imageId);

  if (!image) {
    res.status(404);
    throw new Error("Image not found");
  }

  // Correctly construct the file path
  const filePath = path.join(__dirname, "..", image.imageUrl);

  fs.unlink(filePath, async (err) => {
    if (err) {
      // Log error but continue to delete from DB
      console.error("Failed to delete file from server:", err);
    }

    await ProductImage.findByIdAndDelete(imageId);

    // If the deleted image was primary, try to set a new primary image
    if (image.isPrimary) {
      const remainingImage = await ProductImage.findOne({
        product: image.product,
      });
      if (remainingImage) {
        remainingImage.isPrimary = true;
        await remainingImage.save();
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Image deleted successfully" });
  });
});

// @desc    Update a product image (e.g., set as primary)
// @route   PUT /api/products/images/:imageId
// @access  Public
export const updateProductImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const { isPrimary } = req.body;

  let image = await ProductImage.findById(imageId);
  if (!image) {
    res.status(404);
    throw new Error("Image not found");
  }

  // If setting a new primary image, unset other primary images for this product
  if (isPrimary) {
    await ProductImage.updateMany(
      { product: image.product, _id: { $ne: imageId } },
      { $set: { isPrimary: false } }
    );
  }

  image = await ProductImage.findByIdAndUpdate(
    imageId,
    { isPrimary },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: image,
    message: "Image updated successfully",
  });
});
