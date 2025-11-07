// controllers/categoryController.js
import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";

/** Auto icon & color based on name */
const getAutoIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("grocery")) return "🛒";
  if (n.includes("bakery") || n.includes("bread")) return "🍞";
  if (n.includes("fruit") || n.includes("apple")) return "🍎";
  if (n.includes("vegetable") || n.includes("veggie")) return "🥕";
  if (n.includes("beverage") || n.includes("drink") || n.includes("juice"))
    return "🥤";
  if (n.includes("dairy") || n.includes("milk") || n.includes("cheese"))
    return "🥛";
  if (n.includes("meat") || n.includes("chicken") || n.includes("fish"))
    return "🍖";
  if (n.includes("snack") || n.includes("chips")) return "🍿";
  if (n.includes("health") || n.includes("medical")) return "💊";
  if (n.includes("beauty") || n.includes("cosmetic")) return "💄";
  if (n.includes("baby") || n.includes("kid")) return "👶";
  if (n.includes("pet")) return "🐕";
  if (n.includes("home") || n.includes("furniture")) return "🏠";
  if (n.includes("book") || n.includes("education")) return "📚";
  return "✨";
};

const getAutoColor = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("fruit") || n.includes("organic")) return "#4CAF50";
  if (n.includes("bakery") || n.includes("bread")) return "#FF9800";
  if (n.includes("beverage") || n.includes("drink")) return "#2196F3";
  if (n.includes("meat") || n.includes("seafood")) return "#F44336";
  if (n.includes("dairy")) return "#9C27B0";
  if (n.includes("health") || n.includes("medical")) return "#00BCD4";
  if (n.includes("baby") || n.includes("kid")) return "#E91E63";
  return "#4CAF50";
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
    dateFrom,
    dateTo,
  } = req.query;

  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

  const filter = { isDeleted: false };
  if (search) {
    filter.$or = [
      { $text: { $search: search } },
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
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
      .limit(l),
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
  const { name, description, status = "Active" } = req.body;

  // unique (case-insensitive) among non-deleted
  const exists = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isDeleted: false,
  });
  if (exists) {
    const e = new Error("Category with this name already exists");
    e.statusCode = 409;
    throw e;
  }

  const cat = await Category.create({
    name,
    description,
    status,
    icon: getAutoIcon(name),
    color: getAutoColor(name),
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

  // name change → unique check + new icon/color + new slug (controller-level)
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
    update.icon ??= getAutoIcon(update.name);
    update.color ??= getAutoColor(update.name);
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
  res.json({ success: true, message: "Category deleted" });
});
