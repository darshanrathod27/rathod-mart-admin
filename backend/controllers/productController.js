import Product from "../models/Product.js";
import Category from "../models/Category.js";
import InventoryLedger from "../models/InventoryLedger.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validationResult } from "express-validator";
import { getProductIcon, getProductColor } from "../utils/productIcons.js";

// @desc Get all products
// @route GET /api/products
// @access Public
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    category = "",
    status = "",
    minPrice = "",
    maxPrice = "",
    inStock = "",
    featured = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = { isDeleted: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (featured !== "") filter.featured = featured === "true";
  if (inStock === "true") filter.stock = { $gt: 0 };
  if (inStock === "false") filter.stock = 0;

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name icon color")
      .populate("images")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
    },
  });
});

// @desc Get single product
// @route GET /api/products/:id
// @access Public
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate("category", "name icon color")
    .populate("images");

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc Create new product
// @route POST /api/products
// @access Public
export const createProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { name, description, category, price, stock } = req.body;

  // Check if category exists
  const categoryExists = await Category.findOne({
    _id: category,
    isDeleted: false,
  });

  if (!categoryExists) {
    return res.status(400).json({
      success: false,
      message: "Category not found",
    });
  }

  // Auto-assign icon and color based on product name and category
  const autoIcon = getProductIcon(name, categoryExists.name);
  const autoColor = getProductColor(name, categoryExists.name);

  // Create product WITHOUT stock field (or set to 0)
  const product = await Product.create({
    ...req.body,
    stock: 0, // Always set to 0, managed via InventoryLedger
    icon: autoIcon,
    color: autoColor,
  });

  // If initial stock provided, create inventory ledger entry
  if (stock && stock > 0) {
    await InventoryLedger.create({
      product: product._id,
      variant: null,
      referenceType: "Purchase",
      quantity: Number(stock),
      type: "IN",
      balanceStock: Number(stock),
      remarks: "Initial stock - Product creation",
      createdBy: req.user?._id,
    });

    // Update product stock field for backward compatibility
    product.stock = Number(stock);
    await product.save();
  }

  // Update category product count
  await Category.findByIdAndUpdate(category, {
    $inc: { productsCount: 1 },
  });

  // Populate category info
  await product.populate("category", "name icon color");

  res.status(201).json({
    success: true,
    data: product,
    message: "Product created successfully",
  });
});

// @desc Update product
// @route PUT /api/products/:id
// @access Public
export const updateProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  let product = await Product.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const oldCategoryId = product.category.toString();
  const { category: newCategoryId, name, stock, ...otherUpdates } = req.body;

  // If category is being changed
  if (newCategoryId && newCategoryId !== oldCategoryId) {
    const newCategory = await Category.findOne({
      _id: newCategoryId,
      isDeleted: false,
    });

    if (!newCategory) {
      return res.status(400).json({
        success: false,
        message: "New category not found",
      });
    }

    // Update category counts
    await Promise.all([
      Category.findByIdAndUpdate(oldCategoryId, {
        $inc: { productsCount: -1 },
      }),
      Category.findByIdAndUpdate(newCategoryId, { $inc: { productsCount: 1 } }),
    ]);
  }

  // Auto-update icon and color if name or category changed
  let updateData = { ...otherUpdates };
  if (name && (name !== product.name || newCategoryId)) {
    const categoryForIcon = newCategoryId
      ? await Category.findById(newCategoryId).select("name")
      : await Category.findById(oldCategoryId).select("name");

    updateData.icon = getProductIcon(name, categoryForIcon?.name || "");
    updateData.color = getProductColor(name, categoryForIcon?.name || "");
    updateData.name = name;
  }

  if (newCategoryId) {
    updateData.category = newCategoryId;
  }

  // DON'T update stock directly - it's managed via InventoryLedger
  // Stock updates should only happen through inventory master

  // Update product
  product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate("category", "name icon color");

  res.status(200).json({
    success: true,
    data: product,
    message: "Product updated successfully",
  });
});

// @desc Delete product
// @route DELETE /api/products/:id
// @access Public
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Soft delete product
  await Product.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  // Update category product count
  await Category.findByIdAndUpdate(product.category, {
    $inc: { productsCount: -1 },
  });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// @desc Get product statistics
// @route GET /api/products/stats
// @access Public
export const getProductStats = asyncHandler(async (req, res) => {
  const [stats] = await Product.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStock: { $sum: "$stock" },
        averagePrice: { $avg: "$price" },
        totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
        activeProducts: {
          $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
        },
        outOfStock: {
          $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
        },
        lowStock: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$stock", 0] },
                  { $lte: ["$stock", "$minStock"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        featuredProducts: {
          $sum: { $cond: ["$featured", 1, 0] },
        },
      },
    },
  ]);

  // Get category-wise product count
  const categoryStats = await Product.aggregate([
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    { $unwind: "$categoryInfo" },
    {
      $group: {
        _id: "$category",
        categoryName: { $first: "$categoryInfo.name" },
        productCount: { $sum: 1 },
        totalStock: { $sum: "$stock" },
        avgPrice: { $avg: "$price" },
      },
    },
    { $sort: { productCount: -1 } },
    { $limit: 10 },
  ]);

  // Get top products
  const topProducts = await Product.find({ isDeleted: false })
    .sort({ soldCount: -1, rating: -1 })
    .limit(5)
    .populate("category", "name")
    .select("name price rating soldCount category");

  res.status(200).json({
    success: true,
    data: {
      overview: stats || {
        totalProducts: 0,
        totalStock: 0,
        averagePrice: 0,
        totalValue: 0,
        activeProducts: 0,
        outOfStock: 0,
        lowStock: 0,
        featuredProducts: 0,
      },
      categoryStats,
      topProducts,
    },
  });
});

// @desc Get products by category
// @route GET /api/products/category/:categoryId
// @access Public
export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find({
      category: categoryId,
      isDeleted: false,
    })
      .populate("category", "name icon color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments({
      category: categoryId,
      isDeleted: false,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
    },
  });
});
