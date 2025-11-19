// backend/controllers/variantMasterController.js
import asyncHandler from "../middleware/asyncHandler.js";
import VariantMaster from "../models/VariantMaster.js";
import Product from "../models/Product.js";
import ProductSizeMapping from "../models/ProductSizeMapping.js";
import ProductColorMapping from "../models/ProductColorMapping.js";

/* GET /api/variant-master */
export const getVariants = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 200);
  const skip = (page - 1) * limit;

  const { status, product, search } = req.query;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  const query = { isDeleted: false };

  // 1. Exact Filters
  if (status) query.status = status;
  if (product) query.product = product;

  // 2. Advanced Search
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };

    // A. Find matching Products
    const matchedProducts = await Product.find({
      name: searchRegex,
      isDeleted: { $ne: true },
    }).select("_id");

    // B. Find matching Sizes
    const matchedSizes = await ProductSizeMapping.find({
      sizeName: searchRegex,
      isDeleted: false,
    }).select("_id");

    // C. Find matching Colors
    const matchedColors = await ProductColorMapping.find({
      colorName: searchRegex,
      isDeleted: false,
    }).select("_id");

    const prodIds = matchedProducts.map((p) => p._id);
    const sizeIds = matchedSizes.map((s) => s._id);
    const colorIds = matchedColors.map((c) => c._id);

    // D. Construct OR Query
    query.$or = [
      { sku: searchRegex }, // Search by SKU
      { product: { $in: prodIds } }, // Search by Product Name
      { size: { $in: sizeIds } }, // Search by Size Name
      { color: { $in: colorIds } }, // Search by Color Name
    ];
  }

  const [variants, total] = await Promise.all([
    VariantMaster.find(query)
      .populate("product", "name")
      .populate("size", "sizeName value")
      .populate("color", "colorName value")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    VariantMaster.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      variants,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    },
  });
});

/* GET single */
export const getVariant = asyncHandler(async (req, res) => {
  const variant = await VariantMaster.findById(req.params.id)
    .populate("product", "name")
    .populate("size", "sizeName value")
    .populate("color", "colorName value")
    .lean();
  if (!variant || variant.isDeleted) {
    const e = new Error("Variant not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: variant });
});

/* CREATE multiple */
export const createVariant = asyncHandler(async (req, res) => {
  const { product, variants } = req.body;
  const productExists = await Product.findById(product);
  if (!productExists) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  const createdVariants = [];
  for (const v of variants) {
    const { size, color, price, status } = v;
    const [sizeExists, colorExists] = await Promise.all([
      ProductSizeMapping.findById(size),
      ProductColorMapping.findById(color),
    ]);
    if (!sizeExists) {
      const e = new Error(`Size mapping not found: ${size}`);
      e.statusCode = 404;
      throw e;
    }
    if (!colorExists) {
      const e = new Error(`Color mapping not found: ${color}`);
      e.statusCode = 404;
      throw e;
    }
    const dup = await VariantMaster.findOne({
      product,
      size,
      color,
      isDeleted: false,
    });
    if (dup) {
      const e = new Error(`Variant already exists for this size+color`);
      e.statusCode = 400;
      throw e;
    }
    const created = await VariantMaster.create({
      product,
      size,
      color,
      price,
      status,
    });
    const populated = await VariantMaster.findById(created._id)
      .populate("product", "name")
      .populate("size", "sizeName value")
      .populate("color", "colorName value")
      .lean();
    createdVariants.push(populated);
  }

  res.status(201).json({
    success: true,
    message: `${createdVariants.length} variant(s) created`,
    data: createdVariants,
  });
});

/* UPDATE */
export const updateVariant = asyncHandler(async (req, res) => {
  const { product, size, color, price, status } = req.body;
  const variant = await VariantMaster.findById(req.params.id);
  if (!variant || variant.isDeleted) {
    const e = new Error("Variant not found");
    e.statusCode = 404;
    throw e;
  }

  if (product && product !== variant.product.toString()) {
    const p = await Product.findById(product);
    if (!p) {
      const e = new Error("Product not found");
      e.statusCode = 404;
      throw e;
    }
    variant.product = product;
  }
  if (size && size !== variant.size.toString()) {
    const s = await ProductSizeMapping.findById(size);
    if (!s) {
      const e = new Error("Size mapping not found");
      e.statusCode = 404;
      throw e;
    }
    variant.size = size;
  }
  if (color && color !== variant.color.toString()) {
    const c = await ProductColorMapping.findById(color);
    if (!c) {
      const e = new Error("Color mapping not found");
      e.statusCode = 404;
      throw e;
    }
    variant.color = color;
  }
  if (price !== undefined) variant.price = price;
  if (status) variant.status = status;

  const updated = await variant.save();
  const populated = await VariantMaster.findById(updated._id)
    .populate("product", "name")
    .populate("size", "sizeName value")
    .populate("color", "colorName value")
    .lean();

  res.json({ success: true, message: "Variant updated", data: populated });
});

/* DELETE (soft) */
export const deleteVariant = asyncHandler(async (req, res) => {
  const variant = await VariantMaster.findById(req.params.id);
  if (!variant || variant.isDeleted) {
    const e = new Error("Variant not found");
    e.statusCode = 404;
    throw e;
  }
  variant.isDeleted = true;
  variant.deletedAt = new Date();
  await variant.save();
  res.json({ success: true, message: "Variant deleted" });
});

/* GET by product (no pagination) */
export const getVariantsByProduct = asyncHandler(async (req, res) => {
  const variants = await VariantMaster.find({
    product: req.params.productId,
    isDeleted: false,
  })
    .populate("product", "name")
    .populate("size", "sizeName value")
    .populate("color", "colorName value")
    .lean();
  res.json({ success: true, data: variants });
});
