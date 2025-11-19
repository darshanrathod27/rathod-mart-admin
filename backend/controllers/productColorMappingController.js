// backend/controllers/productColorMappingController.js
import asyncHandler from "../middleware/asyncHandler.js";
import ProductColorMapping from "../models/ProductColorMapping.js";
import Product from "../models/Product.js";

/* LIST - Advanced Search (Includes Product Name) & Filter */
export const getColorMappings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    product,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const q = { isDeleted: false };

  // Exact filters
  if (product) q.product = product;
  if (status) q.status = status;

  // Advanced Search: Matches Color Name, Color Value OR Product Name
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };

    // 1. Find products that match the search name
    const matchedProducts = await Product.find({
      name: searchRegex,
      isDeleted: { $ne: true },
    }).select("_id");

    const matchedProductIds = matchedProducts.map((p) => p._id);

    // 2. Build the OR query
    q.$or = [
      { colorName: searchRegex },
      { value: searchRegex },
      { product: { $in: matchedProductIds } }, // Search by product name
    ];
  }

  const sort = { [sortBy]: String(sortOrder).toLowerCase() === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    ProductColorMapping.find(q)
      .populate("product", "name slug")
      .sort(sort)
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    ProductColorMapping.countDocuments(q),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

/* GET ONE */
export const getColorMapping = asyncHandler(async (req, res) => {
  const row = await ProductColorMapping.findById(req.params.id)
    .populate("product", "name slug")
    .lean();

  if (!row || row.isDeleted) {
    const e = new Error("Color mapping not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: row });
});

/* CREATE */
export const createColorMapping = asyncHandler(async (req, res) => {
  const { product, colorName, value, status } = req.body;

  const prod = await Product.findById(product);
  if (!prod) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  const dup = await ProductColorMapping.findOne({
    product,
    colorName: String(colorName).trim(),
    isDeleted: false,
  });
  if (dup) {
    const e = new Error("Color mapping already exists for this product");
    e.statusCode = 400;
    throw e;
  }

  const created = await ProductColorMapping.create({
    product,
    colorName: String(colorName).trim(),
    value: String(value).trim(),
    status: status || "Active",
  });

  const populated = await ProductColorMapping.findById(created._id)
    .populate("product", "name slug")
    .lean();

  res.status(201).json({ success: true, data: populated });
});

/* UPDATE */
export const updateColorMapping = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const existing = await ProductColorMapping.findById(id);
  if (!existing || existing.isDeleted) {
    const e = new Error("Color mapping not found");
    e.statusCode = 404;
    throw e;
  }

  const { product, colorName, value, status } = req.body;

  if (product && String(product) !== String(existing.product)) {
    const prod = await Product.findById(product);
    if (!prod) {
      const e = new Error("Product not found");
      e.statusCode = 404;
      throw e;
    }
    existing.product = product;
  }

  if (colorName !== undefined) existing.colorName = String(colorName).trim();
  if (value !== undefined) existing.value = String(value).trim();
  if (status !== undefined) existing.status = status;

  const dup = await ProductColorMapping.findOne({
    _id: { $ne: existing._id },
    product: existing.product,
    colorName: existing.colorName,
    isDeleted: false,
  });
  if (dup) {
    const e = new Error("Color mapping already exists for this product");
    e.statusCode = 400;
    throw e;
  }

  await existing.save();
  const out = await ProductColorMapping.findById(existing._id)
    .populate("product", "name slug")
    .lean();

  res.json({ success: true, data: out });
});

/* DELETE (soft) */
export const deleteColorMapping = asyncHandler(async (req, res) => {
  const row = await ProductColorMapping.findById(req.params.id);
  if (!row || row.isDeleted) {
    const e = new Error("Color mapping not found");
    e.statusCode = 404;
    throw e;
  }
  row.isDeleted = true;
  row.deletedAt = new Date();
  await row.save();

  res.json({ success: true, message: "Color mapping deleted successfully" });
});

/* BY PRODUCT */
export const getColorMappingsByProduct = asyncHandler(async (req, res) => {
  const list = await ProductColorMapping.find({
    product: req.params.productId,
    isDeleted: false,
    status: "Active",
  })
    .sort({ colorName: 1 })
    .lean();

  res.json({ success: true, data: list });
});
