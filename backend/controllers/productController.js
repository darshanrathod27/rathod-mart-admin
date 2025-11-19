// backend/controllers/productController.js

import fs from "fs";
import path from "path";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { updateCategoryProductCount } from "./categoryController.js";

const buildFullUrl = (req, relPath) => {
  if (!relPath) return null;
  const p = relPath.startsWith("/") ? relPath : `/${relPath}`;
  return `${req.protocol}://${req.get("host")}${p}`;
};

const UPLOAD_FOLDER = "/uploads/products";
const ABS_UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");

const removeFile = async (filename) => {
  if (!filename) return;
  try {
    const filePath = path.join(ABS_UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (e) {
    console.error("Failed deleting file:", e);
  }
};

/* -------------------- Create Product -------------------- */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    category,
    brand,
    basePrice,
    discountPrice,
    tags,
    features,
    status,
    featured,
    trending,
    isBestOffer,
  } = req.body;

  const cat = await Category.findById(category);
  if (!cat) {
    const e = new Error("Invalid category");
    e.statusCode = 400;
    throw e;
  }

  const slugBase = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${slugBase}-${Date.now().toString(36).slice(-6)}`;

  const images = [];
  const variantIdForUploads = req.body.variantId || null;

  if (req.files && req.files.length) {
    for (let i = 0; i < req.files.length; i++) {
      const f = req.files[i];
      images.push({
        url: `${UPLOAD_FOLDER}/${f.filename}`,
        filename: f.filename,
        alt: `${name} - image ${i + 1}`,
        isPrimary: i === 0,
        sortOrder: i,
        variant: variantIdForUploads || null,
      });
    }
  }

  const product = new Product({
    name,
    description,
    shortDescription,
    category,
    brand,
    images,
    basePrice: Number(basePrice || 0),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    tags: Array.isArray(tags)
      ? tags
      : typeof tags === "string" && tags
      ? tags.split(",").map((t) => t.trim())
      : [],
    features: Array.isArray(features)
      ? features
      : typeof features === "string" && features
      ? features.split(",").map((t) => t.trim())
      : [],
    status: status || "draft",
    slug,
    totalStock: 0,
    featured: featured === "true" || featured === true,
    trending: trending === "true" || trending === true,
    isBestOffer: isBestOffer === "true" || isBestOffer === true,
  });

  const saved = await product.save();
  await saved.populate("category", "name slug");

  try {
    if (saved.category) {
      await updateCategoryProductCount(
        saved.category._id ? saved.category._id : saved.category
      );
    }
  } catch (err) {
    console.warn("updateCategoryProductCount failed after create:", err);
  }

  const result = saved.toObject();
  result.images = (result.images || []).map((img) => ({
    ...img,
    fullUrl: buildFullUrl(req, img.url),
  }));

  res.status(201).json({ success: true, data: result });
});

/* -------------------- List with pagination/filter/search/sort - ENHANCED SEARCH -------------------- */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    status,
    search,
    minPrice,
    maxPrice,
    sortBy = "createdAt",
    sortOrder = "desc",
    featured,
    trending,
    isBestOffer,
  } = req.query;

  const q = { isDeleted: { $ne: true } };

  if (category) q.category = category;
  if (status) q.status = status;

  if (typeof featured !== "undefined") {
    if (featured === "true") q.featured = true;
    else if (featured === "false") q.featured = false;
  }

  if (typeof trending !== "undefined") {
    if (trending === "true") q.trending = true;
    else if (trending === "false") q.trending = false;
  }

  if (typeof isBestOffer !== "undefined") {
    if (isBestOffer === "true") q.isBestOffer = true;
    else if (isBestOffer === "false") q.isBestOffer = false;
  }

  if (minPrice || maxPrice) {
    q.basePrice = {};
    if (minPrice) q.basePrice.$gte = Number(minPrice);
    if (maxPrice) q.basePrice.$lte = Number(maxPrice);
  }

  // ✅ ADVANCED SEARCH: Search by name, brand, description, price
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    const priceAsNumber = parseFloat(search);

    q.$or = [
      { name: searchRegex },
      { brand: searchRegex },
      { description: searchRegex },
      { shortDescription: searchRegex },
    ];

    // If search is a number (e.g., "200"), search by price
    if (!isNaN(priceAsNumber)) {
      q.$or.push({ basePrice: priceAsNumber });
      q.$or.push({ discountPrice: priceAsNumber });
    }
  }

  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 12, 1), 100);

  const sortObj = {};
  sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Product.find(q)
      .populate("category", "name slug")
      .sort(sortObj)
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Product.countDocuments(q),
  ]);

  const VariantModel =
    mongoose.models.VariantMaster || mongoose.models.Variant || null;
  let variantsByProduct = {};

  if (VariantModel && items.length) {
    const productIds = items.map((it) => it._id);
    const allVariants = await VariantModel.find({
      product: { $in: productIds },
      isDeleted: false,
    })
      .populate("size", "sizeName value")
      .populate("color", "colorName value")
      .lean();

    for (const v of allVariants) {
      const pid = v.product?.toString();
      if (!variantsByProduct[pid]) variantsByProduct[pid] = [];
      variantsByProduct[pid].push(v);
    }
  }

  const rows = items.map((prod) => {
    const primary =
      (prod.images || []).find((i) => i.isPrimary) ||
      (prod.images && prod.images[0]) ||
      null;

    const pObj = {
      ...prod,
      primaryImage: primary ? primary.url : null,
      primaryImageFullUrl: primary ? buildFullUrl(req, primary.url) : null,
    };
    pObj.variants = variantsByProduct[prod._id.toString()] || [];
    return pObj;
  });

  res.json({
    success: true,
    data: rows,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

/* -------------------- Get single product -------------------- */
export const getProduct = asyncHandler(async (req, res) => {
  const prod = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .lean();

  if (!prod) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  prod.images = (prod.images || []).map((img) => ({
    ...img,
    fullUrl: buildFullUrl(req, img.url),
  }));

  const VariantModel =
    mongoose.models.VariantMaster || mongoose.models.Variant || null;
  if (VariantModel) {
    const variants = await VariantModel.find({
      product: req.params.id,
      isDeleted: false,
    })
      .populate("size", "sizeName value")
      .populate("color", "colorName value")
      .lean();
    prod.variants = variants;
  } else {
    prod.variants = [];
  }

  res.json({ success: true, data: prod });
});

/* -------------------- Update Product -------------------- */
export const updateProduct = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const existing = await Product.findById(id);

  if (!existing) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  const oldCategoryId = existing.category ? existing.category.toString() : null;
  const update = { ...req.body };

  if (typeof update.tags === "string") {
    try {
      update.tags = JSON.parse(update.tags);
    } catch {
      update.tags = update.tags.split(",").map((s) => s.trim());
    }
  }

  if (typeof update.features === "string") {
    try {
      update.features = JSON.parse(update.features);
    } catch {
      update.features = update.features.split(",").map((s) => s.trim());
    }
  }

  if (update.deleteFilenames) {
    try {
      const delList =
        typeof update.deleteFilenames === "string"
          ? JSON.parse(update.deleteFilenames)
          : update.deleteFilenames;

      if (Array.isArray(delList) && delList.length) {
        for (const fname of delList) {
          await removeFile(fname);
        }
        existing.images = (existing.images || []).filter(
          (img) => !delList.includes(img.filename)
        );
      }
    } catch (e) {
      console.warn("deleteFilenames parse error", e);
    }
  }

  if (req.files && req.files.length) {
    const startIndex = (existing.images || []).length;
    const variantIdForUploads = req.body.variantId || update.variantId || null;

    for (let i = 0; i < req.files.length; i++) {
      const f = req.files[i];
      existing.images.push({
        url: `${UPLOAD_FOLDER}/${f.filename}`,
        filename: f.filename,
        alt: `${existing.name || update.name || ""} - image ${
          startIndex + i + 1
        }`,
        isPrimary: (existing.images || []).length === 0 && i === 0,
        sortOrder: startIndex + i,
        variant: variantIdForUploads || null,
      });
    }
  }

  const allowed = [
    "name",
    "description",
    "shortDescription",
    "category",
    "brand",
    "basePrice",
    "discountPrice",
    "tags",
    "features",
    "status",
    "featured",
    "trending",
    "isBestOffer",
  ];

  for (const k of allowed) {
    if (update[k] !== undefined) {
      if (["featured", "trending", "isBestOffer"].includes(k)) {
        existing[k] = update[k] === "true" || update[k] === true;
      } else {
        existing[k] = update[k];
      }
    }
  }

  if (update.name && update.name !== existing.name) {
    existing.slug = `${update.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-5)}`;
  }

  await existing.save();
  await existing.populate("category", "name slug");

  try {
    const newCategoryId = existing.category
      ? (existing.category._id || existing.category).toString()
      : null;

    if (newCategoryId) {
      await updateCategoryProductCount(newCategoryId);
    }
    if (oldCategoryId && oldCategoryId !== newCategoryId) {
      await updateCategoryProductCount(oldCategoryId);
    }
  } catch (err) {
    console.warn("updateCategoryProductCount failed after update:", err);
  }

  const out = existing.toObject();
  out.images = (out.images || []).map((img) => ({
    ...img,
    fullUrl: buildFullUrl(req, img.url),
  }));

  res.json({ success: true, message: "Updated", data: out });
});

/* -------------------- Delete product -------------------- */
export const deleteProduct = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  const categoryId = p.category ? p.category.toString() : null;

  for (const img of p.images || []) {
    if (img.filename) await removeFile(img.filename);
  }

  await Product.findByIdAndDelete(req.params.id);

  try {
    if (categoryId) await updateCategoryProductCount(categoryId);
  } catch (err) {
    console.warn("updateCategoryProductCount failed after delete:", err);
  }

  res.json({ success: true, message: "Product deleted" });
});

/* -------------------- Reorder images -------------------- */
export const reorderImages = asyncHandler(async (req, res) => {
  const { imageFilenames } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product)
    throw Object.assign(new Error("Product not found"), { statusCode: 404 });

  if (!Array.isArray(imageFilenames)) {
    const err = new Error("imageFilenames must be array");
    err.statusCode = 400;
    throw err;
  }

  const newImgs = [];
  imageFilenames.forEach((fname, idx) => {
    const img = product.images.find((x) => x.filename === fname);
    if (img) {
      img.sortOrder = idx;
      img.isPrimary = idx === 0;
      newImgs.push(img);
    }
  });

  product.images = newImgs;
  await product.save();

  res.json({
    success: true,
    message: "Images reordered",
    data: product.images,
  });
});

/* -------------------- Set primary image -------------------- */
export const setPrimaryImage = asyncHandler(async (req, res) => {
  const { filename } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product)
    throw Object.assign(new Error("Product not found"), { statusCode: 404 });

  let found = false;
  product.images.forEach((img) => {
    if (img.filename === filename) {
      img.isPrimary = true;
      found = true;
    } else img.isPrimary = false;
  });

  if (!found) {
    const err = new Error("filename not found in product images");
    err.statusCode = 400;
    throw err;
  }

  await product.save();
  res.json({ success: true, message: "Primary updated" });
});

/* -------------------- Get product variants -------------------- */
export const getProductVariants = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const VariantModel =
    mongoose.models.VariantMaster || mongoose.models.Variant || null;

  if (!VariantModel) {
    return res.json({ success: true, data: [] });
  }

  const variants = await VariantModel.find({ product: productId }).lean();
  res.json({ success: true, data: variants });
});

/* -------------------- Recalculate totalStock -------------------- */
export const recalculateStock = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);

  if (!product) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  const VariantModel =
    mongoose.models.VariantMaster || mongoose.models.Variant || null;
  let total = 0;

  if (VariantModel) {
    const variants = await VariantModel.find({ product: productId }).lean();
    for (const v of variants) {
      if (typeof v.stock === "number") total += v.stock;
      else if (v.quantity && typeof v.quantity === "number")
        total += v.quantity;
    }
  } else {
    const InventoryModel = mongoose.models.Inventory || null;
    if (InventoryModel) {
      const inventories = await InventoryModel.find({
        product: productId,
      }).lean();
      for (const it of inventories) {
        if (typeof it.stock === "number") total += it.stock;
      }
    }
  }

  product.totalStock = total;
  await product.save();

  res.json({
    success: true,
    message: "Recalculated totalStock",
    totalStock: total,
  });
});
