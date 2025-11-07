// backend/controllers/productSizeMappingController.js
import asyncHandler from "../middleware/asyncHandler.js";
import ProductSizeMapping from "../models/ProductSizeMapping.js";
import Product from "../models/Product.js";

/* LIST */
export const getSizeMappings = asyncHandler(async (req, res) => {
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
  if (product) q.product = product;
  if (status) q.status = status;
  if (search) {
    q.$or = [
      { sizeName: { $regex: search, $options: "i" } },
      { value: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: String(sortOrder).toLowerCase() === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    ProductSizeMapping.find(q)
      .populate("product", "name slug")
      .sort(sort)
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    ProductSizeMapping.countDocuments(q),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

/* GET ONE */
export const getSizeMapping = asyncHandler(async (req, res) => {
  const row = await ProductSizeMapping.findById(req.params.id)
    .populate("product", "name slug")
    .lean();

  if (!row || row.isDeleted) {
    const e = new Error("Size mapping not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: row });
});

/* CREATE */
export const createSizeMapping = asyncHandler(async (req, res) => {
  const { product, sizeName, value, status } = req.body;

  const prod = await Product.findById(product);
  if (!prod) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  const dup = await ProductSizeMapping.findOne({
    product,
    sizeName: String(sizeName).trim(),
    isDeleted: false,
  });
  if (dup) {
    const e = new Error("Size mapping already exists for this product");
    e.statusCode = 400;
    throw e;
  }

  const created = await ProductSizeMapping.create({
    product,
    sizeName: String(sizeName).trim(),
    value: String(value).trim(),
    status: status || "Active",
  });

  const populated = await ProductSizeMapping.findById(created._id)
    .populate("product", "name slug")
    .lean();

  res.status(201).json({ success: true, data: populated });
});

/* UPDATE */
export const updateSizeMapping = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const existing = await ProductSizeMapping.findById(id);
  if (!existing || existing.isDeleted) {
    const e = new Error("Size mapping not found");
    e.statusCode = 404;
    throw e;
  }

  const { product, sizeName, value, status } = req.body;

  if (product && String(product) !== String(existing.product)) {
    const prod = await Product.findById(product);
    if (!prod) {
      const e = new Error("Product not found");
      e.statusCode = 404;
      throw e;
    }
    existing.product = product;
  }

  if (sizeName !== undefined) existing.sizeName = String(sizeName).trim();
  if (value !== undefined) existing.value = String(value).trim();
  if (status !== undefined) existing.status = status;

  const dup = await ProductSizeMapping.findOne({
    _id: { $ne: existing._id },
    product: existing.product,
    sizeName: existing.sizeName,
    isDeleted: false,
  });
  if (dup) {
    const e = new Error("Size mapping already exists for this product");
    e.statusCode = 400;
    throw e;
  }

  await existing.save();
  const out = await ProductSizeMapping.findById(existing._id)
    .populate("product", "name slug")
    .lean();

  res.json({ success: true, data: out });
});

/* DELETE (soft, like your mapping) */
export const deleteSizeMapping = asyncHandler(async (req, res) => {
  const row = await ProductSizeMapping.findById(req.params.id);
  if (!row || row.isDeleted) {
    const e = new Error("Size mapping not found");
    e.statusCode = 404;
    throw e;
  }
  row.isDeleted = true;
  row.deletedAt = new Date();
  await row.save();

  res.json({ success: true, message: "Size mapping deleted successfully" });
});

/* BY PRODUCT */
export const getSizeMappingsByProduct = asyncHandler(async (req, res) => {
  const list = await ProductSizeMapping.find({
    product: req.params.productId,
    isDeleted: false,
    status: "Active",
  })
    .sort({ sizeName: 1 })
    .lean();

  res.json({ success: true, data: list });
});
