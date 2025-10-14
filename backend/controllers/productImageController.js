// backend/controllers/productImageController.js
import ProductImage from "../models/ProductImage.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get base URL from environment or use default
const getBaseUrl = () => {
  return process.env.BASE_URL || "http://localhost:5000";
};

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
  const isPrimary = imageCount === 0;

  // Store both relative path and full URL
  const relativePath = `/uploads/${req.file.filename}`;
  const fullImageUrl = `${getBaseUrl()}${relativePath}`;

  const productImage = await ProductImage.create({
    product: productId,
    imageUrl: relativePath,
    fullImageUrl: fullImageUrl,
    isPrimary: isPrimary,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });

  // Return with populated product info and proper URLs
  const populatedImage = await ProductImage.findById(productImage._id).populate(
    "product",
    "name"
  );

  res.status(201).json({
    success: true,
    data: {
      ...populatedImage.toObject(),
      fullImageUrl: fullImageUrl,
    },
    message: "Image uploaded successfully",
  });
});

// @desc    Upload multiple images for a product
// @route   POST /api/products/:productId/images/multiple
// @access  Public
export const uploadMultipleProductImages = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("Please upload at least one file");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const existingImageCount = await ProductImage.countDocuments({
    product: productId,
  });
  const uploadedImages = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const isPrimary = existingImageCount === 0 && i === 0;

    const relativePath = `/uploads/${file.filename}`;
    const fullImageUrl = `${getBaseUrl()}${relativePath}`;

    const productImage = await ProductImage.create({
      product: productId,
      imageUrl: relativePath,
      fullImageUrl: fullImageUrl,
      isPrimary: isPrimary,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    uploadedImages.push({
      ...productImage.toObject(),
      fullImageUrl: fullImageUrl,
    });
  }

  res.status(201).json({
    success: true,
    data: uploadedImages,
    message: `${uploadedImages.length} images uploaded successfully`,
  });
});

// @desc    Get all images for a product
// @route   GET /api/products/:productId/images
// @access  Public
export const getProductImages = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const images = await ProductImage.find({ product: productId })
    .populate("product", "name")
    .sort({ isPrimary: -1, createdAt: 1 });

  // Add full URLs to response
  const imagesWithUrls = images.map((img) => ({
    ...img.toObject(),
    fullImageUrl: `${getBaseUrl()}${img.imageUrl}`,
  }));

  res.status(200).json({
    success: true,
    data: imagesWithUrls,
  });
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

  // Construct correct file path
  const filePath = path.join(__dirname, "..", "..", image.imageUrl);

  // Delete file from filesystem
  fs.unlink(filePath, async (err) => {
    if (err) {
      console.error("Failed to delete file from server:", err);
    }

    await ProductImage.findByIdAndDelete(imageId);

    // If deleted image was primary, set another as primary
    if (image.isPrimary) {
      const remainingImage = await ProductImage.findOne({
        product: image.product,
      });
      if (remainingImage) {
        remainingImage.isPrimary = true;
        await remainingImage.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
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

  // If setting as primary, unset other primary images
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
    data: {
      ...image.toObject(),
      fullImageUrl: `${getBaseUrl()}${image.imageUrl}`,
    },
    message: "Image updated successfully",
  });
});
