import asyncHandler from "../middleware/asyncHandler.js";
import ProductColorMapping from "../models/ProductColorMapping.js";
import Product from "../models/Product.js";

// @desc    Get all color mappings with pagination
// @route   GET /api/product-color-mappings
// @access  Public
export const getColorMappings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const status = req.query.status || "";
  const product = req.query.product || "";

  // Build query
  const query = { isDeleted: false };

  if (status) {
    query.status = status;
  }

  if (product) {
    query.product = product;
  }

  if (search) {
    query.$or = [
      { colorName: { $regex: search, $options: "i" } },
      { value: { $regex: search, $options: "i" } },
    ];
  }

  // Execute query with pagination
  const mappings = await ProductColorMapping.find(query)
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ProductColorMapping.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      mappings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    },
  });
});

// @desc    Get single color mapping
// @route   GET /api/product-color-mappings/:id
// @access  Public
export const getColorMapping = asyncHandler(async (req, res) => {
  const mapping = await ProductColorMapping.findById(req.params.id).populate(
    "product",
    "name"
  );

  if (!mapping || mapping.isDeleted) {
    res.status(404);
    throw new Error("Color mapping not found");
  }

  res.status(200).json({
    success: true,
    data: mapping,
  });
});

// @desc    Create color mapping
// @route   POST /api/product-color-mappings
// @access  Private/Admin
export const createColorMapping = asyncHandler(async (req, res) => {
  const { product, colorName, value, status } = req.body;

  // Validate product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check for duplicate
  const existingMapping = await ProductColorMapping.findOne({
    product,
    colorName,
    isDeleted: false,
  });

  if (existingMapping) {
    res.status(400);
    throw new Error("Color mapping already exists for this product");
  }

  const mapping = await ProductColorMapping.create({
    product,
    colorName,
    value,
    status,
  });

  const populatedMapping = await ProductColorMapping.findById(
    mapping._id
  ).populate("product", "name");

  res.status(201).json({
    success: true,
    message: "Color mapping created successfully",
    data: populatedMapping,
  });
});

// @desc    Update color mapping
// @route   PUT /api/product-color-mappings/:id
// @access  Private/Admin
export const updateColorMapping = asyncHandler(async (req, res) => {
  const { product, colorName, value, status } = req.body;

  const mapping = await ProductColorMapping.findById(req.params.id);

  if (!mapping || mapping.isDeleted) {
    res.status(404);
    throw new Error("Color mapping not found");
  }

  // If product is being changed, validate it exists
  if (product && product !== mapping.product.toString()) {
    const productExists = await Product.findById(product);
    if (!productExists) {
      res.status(404);
      throw new Error("Product not found");
    }
  }

  // Update fields
  mapping.product = product || mapping.product;
  mapping.colorName = colorName || mapping.colorName;
  mapping.value = value || mapping.value;
  mapping.status = status || mapping.status;

  const updatedMapping = await mapping.save();
  const populatedMapping = await ProductColorMapping.findById(
    updatedMapping._id
  ).populate("product", "name");

  res.status(200).json({
    success: true,
    message: "Color mapping updated successfully",
    data: populatedMapping,
  });
});

// @desc    Delete color mapping (soft delete)
// @route   DELETE /api/product-color-mappings/:id
// @access  Private/Admin
export const deleteColorMapping = asyncHandler(async (req, res) => {
  const mapping = await ProductColorMapping.findById(req.params.id);

  if (!mapping || mapping.isDeleted) {
    res.status(404);
    throw new Error("Color mapping not found");
  }

  mapping.isDeleted = true;
  mapping.deletedAt = new Date();
  await mapping.save();

  res.status(200).json({
    success: true,
    message: "Color mapping deleted successfully",
  });
});

// @desc    Get mappings by product
// @route   GET /api/product-color-mappings/product/:productId
// @access  Public
export const getColorMappingsByProduct = asyncHandler(async (req, res) => {
  const mappings = await ProductColorMapping.find({
    product: req.params.productId,
    isDeleted: false,
    status: "Active",
  }).populate("product", "name");

  res.status(200).json({
    success: true,
    data: mappings,
  });
});
