// backend/controllers/categoryController.js
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getCategoryIcon as getAutoIcon,
  getCategoryColor as getAutoColor,
} from "../utils/categoryIcons.js";

/**
 * Update the productsCount for a given categoryId.
 * Counts products with status "active" or "draft".
 */
export const updateCategoryProductCount = async (categoryId) => {
  if (!categoryId) return;
  try {
    const count = await Product.countDocuments({
      category: categoryId,
      status: { $in: ["active", "draft"] },
    });
    await Category.findByIdAndUpdate(categoryId, { productsCount: count });
  } catch (err) {
    console.error(`Failed to update count for category ${categoryId}:`, err);
  }
};

// ------ List (search/paginate/sort/filter) ------
export const getCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const filter = { isDeleted: false };

  // Use $regex only to avoid "No query solutions" error with $text
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (status) filter.status = status;

  const sortKey = sortBy || "createdAt";
  const dir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Category.find(filter)
      .sort({ [sortKey]: dir })
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

// Get single category
export const getCategory = asyncHandler(async (req, res) => {
  const item = await Category.findOne({ _id: req.params.id, isDeleted: false });
  if (!item) {
    const e = new Error("Category not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: item });
});

// Create new category
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description = "", status = "active" } = req.body;
  if (!name) {
    const e = new Error("Category name is required");
    e.statusCode = 400;
    throw e;
  }

  const exists = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isDeleted: false,
  });
  if (exists) {
    const e = new Error("Category already exists");
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

// Update category
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

// Soft-delete category
export const deleteCategory = asyncHandler(async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
  });
  // Recount products for that category (keeps counts accurate)
  await updateCategoryProductCount(req.params.id);
  res.json({ success: true, message: "Category deleted" });
});

// Admin utilities

// Recalculate product counts for all categories
export const recountAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isDeleted: false }).select("_id");
  for (const cat of categories) {
    // Sequential is fine here; if you want concurrency use Promise.allSettled in batches
    await updateCategoryProductCount(cat._id);
  }
  res.json({ success: true, message: "Recalculated counts." });
});

// Fix icons & colors using your generator util
export const fixCategoryIcons = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isDeleted: false });
  let count = 0;
  for (const cat of categories) {
    cat.icon = getAutoIcon(cat.name);
    cat.color = getAutoColor(cat.name);
    await cat.save();
    count++;
  }
  res.json({ success: true, message: `Updated ${count} categories.` });
});
