// backend/controllers/categoryController.js

import Category from "../models/Category.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getCategoryIcon as getAutoIcon,
  getCategoryColor as getAutoColor,
} from "../utils/categoryIcons.js";

/**
 * Helper: Update product count for a category
 */
export const updateCategoryProductCount = async (categoryId) => {
  if (!categoryId) return;
  try {
    const count = await Product.countDocuments({
      category: categoryId,
      status: { $in: ["active", "draft"] },
    });
    await Category.findByIdAndUpdate(categoryId, { productsCount: count });
    console.log(`Updated productsCount for category ${categoryId} => ${count}`);
  } catch (err) {
    console.error(`Failed to update count for category ${categoryId}:`, err);
  }
};

// ------ List (search/paginate/sort/filter) - ENHANCED SEARCH ------
export const getCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    dateFrom,
    dateTo,
  } = req.query;

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const filter = { isDeleted: false };

  // ✅ ADVANCED SEARCH: Search by name and description (case-insensitive)
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    filter.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  if (status) filter.status = status;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const allowSort = new Set([
    "name",
    "status",
    "createdAt",
    "updatedAt",
    "productsCount",
  ]);
  const key = allowSort.has(sortBy) ? sortBy : "createdAt";
  const dir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Category.find(filter)
      .sort({ [key]: dir })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Category.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

// ------ Get one ------
export const getCategory = asyncHandler(async (req, res) => {
  const item = await Category.findOne({ _id: req.params.id, isDeleted: false });
  if (!item) {
    const e = new Error("Category not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: item });
});

// ------ Create ------
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description = "", status = "active" } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    const e = new Error("Category name is required");
    e.statusCode = 400;
    throw e;
  }

  const exists = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isDeleted: false,
  });
  if (exists) {
    const e = new Error("Category with this name already exists");
    e.statusCode = 409;
    throw e;
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const cat = await Category.create({
    name,
    description,
    status,
    icon: getAutoIcon(name),
    color: getAutoColor(name),
    productsCount: 0,
    slug,
  });

  res.status(201).json({ success: true, data: cat });
});

// ------ Update ------
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = { ...req.body };

  const current = await Category.findOne({ _id: id, isDeleted: false });
  if (!current) {
    const e = new Error("Category not found");
    e.statusCode = 404;
    throw e;
  }

  if (update.name && update.name !== current.name) {
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${update.name}$`, "i") },
      _id: { $ne: id },
      isDeleted: false,
    });
    if (exists) {
      const e = new Error("Category name already exists");
      e.statusCode = 409;
      throw e;
    }

    update.icon = getAutoIcon(update.name);
    update.color = getAutoColor(update.name);
    update.slug = update.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  const cat = await Category.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: cat });
});

// ------ Soft Delete ------
export const deleteCategory = asyncHandler(async (req, res) => {
  const item = await Category.findOne({ _id: req.params.id, isDeleted: false });
  if (!item) {
    const e = new Error("Category not found");
    e.statusCode = 404;
    throw e;
  }

  await Category.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  try {
    await updateCategoryProductCount(req.params.id);
  } catch (err) {
    console.warn("Failed to update category count after delete:", err);
  }

  res.json({ success: true, message: "Category deleted" });
});

/**
 * @desc Recalculate product counts for all categories
 * @route GET /api/categories/admin/recount-all
 * @access Admin
 */
export const recountAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).select("_id");
    let processed = 0;
    for (const cat of categories) {
      await updateCategoryProductCount(cat._id);
      processed++;
    }
    res.json({
      success: true,
      message: `Recalculated counts for ${processed} categories.`,
    });
  } catch (err) {
    console.error("Recount error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @desc Fix icons and colors for all existing categories
 * @route GET /api/categories/admin/fix-icons
 * @access Admin
 */
export const fixCategoryIcons = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    let updatedCount = 0;
    for (const cat of categories) {
      const newIcon = getAutoIcon(cat.name);
      const newColor = getAutoColor(cat.name);
      if (cat.icon !== newIcon || cat.color !== newColor) {
        cat.icon = newIcon;
        cat.color = newColor;
        await cat.save();
        updatedCount++;
      }
    }
    res.json({
      success: true,
      message: `Updated icons/colors for ${updatedCount} categories.`,
    });
  } catch (err) {
    console.error("Fix Icons error:", err);
    res.status(500).json({ success: false, message: "Failed to fix icons." });
  }
});
