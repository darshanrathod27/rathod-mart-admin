import asyncHandler from "../middleware/asyncHandler.js";
import ProductSizeMapping from "../models/ProductSizeMapping.js";
import Product from "../models/Product.js";

// @desc    Get all size mappings with pagination
// @route   GET /api/product-size-mappings
// @access  Public
export const getSizeMappings = asyncHandler(async (req, res) => {
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
      { sizeName: { $regex: search, $options: "i" } },
      { value: { $regex: search, $options: "i" } },
    ];
  }

  // Execute query with pagination
  const mappings = await ProductSizeMapping.find(query)
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ProductSizeMapping.countDocuments(query);

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

// @desc    Get single size mapping
// @route   GET /api/product-size-mappings/:id
// @access  Public
export const getSizeMapping = asyncHandler(async (req, res) => {
  const mapping = await ProductSizeMapping.findById(req.params.id).populate(
    "product",
    "name"
  );

  if (!mapping || mapping.isDeleted) {
    res.status(404);
    throw new Error("Size mapping not found");
  }

  res.status(200).json({
    success: true,
    data: mapping,
  });
});

// @desc    Create size mapping
// @route   POST /api/product-size-mappings
// @access  Private/Admin
export const createSizeMapping = asyncHandler(async (req, res) => {
  const { product, sizeName, value, status } = req.body;

  // Validate product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check for duplicate
  const existingMapping = await ProductSizeMapping.findOne({
    product,
    sizeName,
    isDeleted: false,
  });

  if (existingMapping) {
    res.status(400);
    throw new Error("Size mapping already exists for this product");
  }

  const mapping = await ProductSizeMapping.create({
    product,
    sizeName,
    value,
    status,
  });

  const populatedMapping = await ProductSizeMapping.findById(
    mapping._id
  ).populate("product", "name");

  res.status(201).json({
    success: true,
    message: "Size mapping created successfully",
    data: populatedMapping,
  });
});

// @desc    Update size mapping
// @route   PUT /api/product-size-mappings/:id
// @access  Private/Admin
export const updateSizeMapping = asyncHandler(async (req, res) => {
  const { product, sizeName, value, status } = req.body;

  const mapping = await ProductSizeMapping.findById(req.params.id);

  if (!mapping || mapping.isDeleted) {
    res.status(404);
    throw new Error("Size mapping not found");
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
  mapping.sizeName = sizeName || mapping.sizeName;
  mapping.value = value || mapping.value;
  mapping.status = status || mapping.status;

  const updatedMapping = await mapping.save();
  const populatedMapping = await ProductSizeMapping.findById(
    updatedMapping._id
  ).populate("product", "name");

  res.status(200).json({
    success: true,
    message: "Size mapping updated successfully",
    data: populatedMapping,
  });
});

// @desc    Delete size mapping (soft delete)
// @route   DELETE /api/product-size-mappings/:id
// @access  Private/Admin
export const deleteSizeMapping = asyncHandler(async (req, res) => {
  const mapping = await ProductSizeMapping.findById(req.params.id);

  if (!mapping || mapping.isDeleted) {
    res.status(404);
    throw new Error("Size mapping not found");
  }

  mapping.isDeleted = true;
  mapping.deletedAt = new Date();
  await mapping.save();

  res.status(200).json({
    success: true,
    message: "Size mapping deleted successfully",
  });
});

// @desc    Get mappings by product
// @route   GET /api/product-size-mappings/product/:productId
// @access  Public
export const getSizeMappingsByProduct = asyncHandler(async (req, res) => {
  const mappings = await ProductSizeMapping.find({
    product: req.params.productId,
    isDeleted: false,
    status: "Active",
  }).populate("product", "name");

  res.status(200).json({
    success: true,
    data: mappings,
  });
});
