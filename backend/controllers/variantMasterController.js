import asyncHandler from "../middleware/asyncHandler.js";
import VariantMaster from "../models/VariantMaster.js";
import Product from "../models/Product.js";
import ProductSizeMapping from "../models/ProductSizeMapping.js";
import ProductColorMapping from "../models/ProductColorMapping.js";

// @desc    Get all variants with pagination
// @route   GET /api/variants
// @access  Public
export const getVariants = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status || "";
  const product = req.query.product || "";

  const query = { isDeleted: false };

  if (status) query.status = status;
  if (product) query.product = product;

  const variants = await VariantMaster.find(query)
    .populate("product", "name")
    .populate("size", "sizeName value")
    .populate("color", "colorName value")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await VariantMaster.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      variants,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    },
  });
});

// @desc    Get single variant
// @route   GET /api/variants/:id
// @access  Public
export const getVariant = asyncHandler(async (req, res) => {
  const variant = await VariantMaster.findById(req.params.id)
    .populate("product", "name")
    .populate("size", "sizeName value")
    .populate("color", "colorName value");

  if (!variant || variant.isDeleted) {
    res.status(404);
    throw new Error("Variant not found");
  }

  res.status(200).json({
    success: true,
    data: variant,
  });
});

// @desc    Create variant (single or multiple)
// @route   POST /api/variants
// @access  Private/Admin
export const createVariant = asyncHandler(async (req, res) => {
  const { product, variants } = req.body;

  // Validate product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    res.status(404);
    throw new Error("Product not found");
  }

  const createdVariants = [];

  for (const variantData of variants) {
    const { size, color, price, status } = variantData;

    // Validate size and color exist
    const [sizeExists, colorExists] = await Promise.all([
      ProductSizeMapping.findById(size),
      ProductColorMapping.findById(color),
    ]);

    if (!sizeExists) {
      res.status(404);
      throw new Error(`Size mapping not found: ${size}`);
    }

    if (!colorExists) {
      res.status(404);
      throw new Error(`Color mapping not found: ${color}`);
    }

    // Check for duplicate variant
    const existingVariant = await VariantMaster.findOne({
      product,
      size,
      color,
      isDeleted: false,
    });

    if (existingVariant) {
      res.status(400);
      throw new Error(
        `Variant already exists for size ${sizeExists.sizeName} and color ${colorExists.colorName}`
      );
    }

    // Create variant (without stock field)
    const variant = await VariantMaster.create({
      product,
      size,
      color,
      price,
      status,
    });

    const populatedVariant = await VariantMaster.findById(variant._id)
      .populate("product", "name")
      .populate("size", "sizeName value")
      .populate("color", "colorName value");

    createdVariants.push(populatedVariant);
  }

  res.status(201).json({
    success: true,
    message: `${createdVariants.length} variant(s) created successfully`,
    data: createdVariants,
  });
});

// @desc    Update variant
// @route   PUT /api/variants/:id
// @access  Private/Admin
export const updateVariant = asyncHandler(async (req, res) => {
  const { product, size, color, price, status } = req.body;

  const variant = await VariantMaster.findById(req.params.id);

  if (!variant || variant.isDeleted) {
    res.status(404);
    throw new Error("Variant not found");
  }

  // Validate references if changed
  if (product && product !== variant.product.toString()) {
    const productExists = await Product.findById(product);
    if (!productExists) {
      res.status(404);
      throw new Error("Product not found");
    }
    variant.product = product;
  }

  if (size && size !== variant.size.toString()) {
    const sizeExists = await ProductSizeMapping.findById(size);
    if (!sizeExists) {
      res.status(404);
      throw new Error("Size mapping not found");
    }
    variant.size = size;
  }

  if (color && color !== variant.color.toString()) {
    const colorExists = await ProductColorMapping.findById(color);
    if (!colorExists) {
      res.status(404);
      throw new Error("Color mapping not found");
    }
    variant.color = color;
  }

  // Update fields (NO stock field)
  if (price !== undefined) variant.price = price;
  if (status) variant.status = status;

  const updatedVariant = await variant.save();
  const populatedVariant = await VariantMaster.findById(updatedVariant._id)
    .populate("product", "name")
    .populate("size", "sizeName value")
    .populate("color", "colorName value");

  res.status(200).json({
    success: true,
    message: "Variant updated successfully",
    data: populatedVariant,
  });
});

// @desc    Delete variant (soft delete)
// @route   DELETE /api/variants/:id
// @access  Private/Admin
export const deleteVariant = asyncHandler(async (req, res) => {
  const variant = await VariantMaster.findById(req.params.id);

  if (!variant || variant.isDeleted) {
    res.status(404);
    throw new Error("Variant not found");
  }

  variant.isDeleted = true;
  variant.deletedAt = new Date();
  await variant.save();

  res.status(200).json({
    success: true,
    message: "Variant deleted successfully",
  });
});

// @desc    Get variants by product
// @route   GET /api/variants/product/:productId
// @access  Public
export const getVariantsByProduct = asyncHandler(async (req, res) => {
  const variants = await VariantMaster.find({
    product: req.params.productId,
    isDeleted: false,
  })
    .populate("product", "name")
    .populate("size", "sizeName value")
    .populate("color", "colorName value");

  res.status(200).json({
    success: true,
    data: variants,
  });
});
