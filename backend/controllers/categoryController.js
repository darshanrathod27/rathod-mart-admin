import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validationResult } from "express-validator";

// Auto icon assignment function
const getAutoIcon = (categoryName) => {
  const name = categoryName.toLowerCase();

  // Auto icon mapping
  if (name.includes("grocery") || name.includes("groceries")) return "🛒";
  if (
    name.includes("bakery") ||
    name.includes("bread") ||
    name.includes("baking")
  )
    return "🍞";
  if (
    name.includes("fruit") ||
    name.includes("apple") ||
    name.includes("banana")
  )
    return "🍎";
  if (
    name.includes("vegetable") ||
    name.includes("veggie") ||
    name.includes("organic")
  )
    return "🥕";
  if (
    name.includes("beverage") ||
    name.includes("drink") ||
    name.includes("juice")
  )
    return "🥤";
  if (
    name.includes("dairy") ||
    name.includes("milk") ||
    name.includes("cheese")
  )
    return "🥛";
  if (
    name.includes("meat") ||
    name.includes("chicken") ||
    name.includes("fish")
  )
    return "🍖";
  if (
    name.includes("snack") ||
    name.includes("chips") ||
    name.includes("fast food")
  )
    return "🍿";
  if (
    name.includes("health") ||
    name.includes("medical") ||
    name.includes("medicine")
  )
    return "💊";
  if (name.includes("beauty") || name.includes("cosmetic")) return "💄";
  if (name.includes("baby") || name.includes("kid") || name.includes("child"))
    return "👶";
  if (name.includes("pet") || name.includes("animal")) return "🐕";
  if (name.includes("home") || name.includes("furniture")) return "🏠";
  if (name.includes("book") || name.includes("education")) return "📚";

  return "✨"; // Default fallback
};

// Auto color assignment function
const getAutoColor = (categoryName) => {
  const name = categoryName.toLowerCase();

  if (name.includes("fruit") || name.includes("organic")) return "#4CAF50";
  if (name.includes("bakery") || name.includes("bread")) return "#FF9800";
  if (name.includes("beverage") || name.includes("drink")) return "#2196F3";
  if (name.includes("meat") || name.includes("seafood")) return "#F44336";
  if (name.includes("dairy")) return "#9C27B0";
  if (name.includes("health") || name.includes("medical")) return "#00BCD4";
  if (name.includes("baby") || name.includes("kid")) return "#E91E63";

  return "#4CAF50"; // Default green
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = { isDeleted: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (status) filter.status = status;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [categories, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
    Category.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      categories,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
    },
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Public
export const createCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { name, description, status } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isDeleted: false,
  });

  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: "Category with this name already exists",
    });
  }

  // Auto-assign icon and color based on category name
  const autoIcon = getAutoIcon(name);
  const autoColor = getAutoColor(name);

  // Create category with auto-assigned values
  const category = await Category.create({
    name,
    description,
    status: status || "Active",
    icon: autoIcon,
    color: autoColor,
  });

  res.status(201).json({
    success: true,
    data: category,
    message: "Category created successfully with auto-assigned icon",
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Public
export const updateCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  let category = await Category.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  const { name } = req.body;

  // If name is being updated, auto-assign new icon and color
  let updateData = { ...req.body };
  if (name && name !== category.name) {
    updateData.icon = getAutoIcon(name);
    updateData.color = getAutoColor(name);

    // Check if new name already exists
    const nameExists = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: req.params.id },
      isDeleted: false,
    });

    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }
  }

  // Update category
  category = await Category.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: category,
    message: "Category updated successfully",
  });
});

// @desc    Delete category (Soft Delete)
// @route   DELETE /api/categories/:id
// @access  Public
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  // Soft delete - mark as deleted instead of removing from database
  await Category.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

// @desc    Get category statistics
// @route   GET /api/categories/stats
// @access  Public
export const getCategoryStats = asyncHandler(async (req, res) => {
  const [stats, total, activeCount, inactiveCount] = await Promise.all([
    Category.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Category.countDocuments({ isDeleted: false }),
    Category.countDocuments({ isDeleted: false, status: "Active" }),
    Category.countDocuments({ isDeleted: false, status: "Inactive" }),
  ]);

  // Get most popular categories (you can customize this logic)
  const popularCategories = await Category.find({ isDeleted: false })
    .sort({ productsCount: -1, createdAt: -1 })
    .limit(5)
    .select("name icon productsCount");

  // Calculate growth (mock calculation - implement your logic)
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [thisMonthCount, lastMonthCount] = await Promise.all([
    Category.countDocuments({
      isDeleted: false,
      createdAt: { $gte: thisMonth },
    }),
    Category.countDocuments({
      isDeleted: false,
      createdAt: { $gte: lastMonth, $lt: thisMonth },
    }),
  ]);

  const growthPercentage =
    lastMonthCount > 0
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : 100;

  res.status(200).json({
    success: true,
    data: {
      total,
      activeCount,
      inactiveCount,
      growthPercentage,
      byStatus: stats,
      popularCategories,
      monthlyStats: {
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        growth: growthPercentage,
      },
    },
  });
});

// @desc    Restore deleted category
// @route   PUT /api/categories/:id/restore
// @access  Public
export const restoreCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Deleted category not found",
    });
  }

  // Restore the category
  const restoredCategory = await Category.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: false,
      $unset: { deletedAt: 1 },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: restoredCategory,
    message: "Category restored successfully",
  });
});

// @desc    Get deleted categories
// @route   GET /api/categories/deleted
// @access  Public
export const getDeletedCategories = asyncHandler(async (req, res) => {
  const deletedCategories = await Category.find({ isDeleted: true }).sort({
    deletedAt: -1,
  });

  res.status(200).json({
    success: true,
    data: {
      categories: deletedCategories,
      total: deletedCategories.length,
    },
  });
});

// @desc    Permanently delete category
// @route   DELETE /api/categories/:id/permanent
// @access  Public
export const permanentDeleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  // Permanently delete from database
  await Category.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Category permanently deleted",
  });
});
