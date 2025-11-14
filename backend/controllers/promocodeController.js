// backend/controllers/promocodeController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Promocode from "../models/Promocode.js";
import Cart from "../models/Cart.js"; // To check against cart total

/**
 * @desc    Validate a promocode for a user
 * @route   POST /api/promocodes/validate
 * @access  Private (Customer)
 */
export const validatePromocode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;

  if (!code) {
    throwObject("Promocode is required", 400);
  }

  // 1. Find the code
  const promo = await Promocode.findOne({
    code: code.toUpperCase(),
    status: "Active", // Use status string
  });

  if (!promo) {
    throwObject("Promocode not found or is inactive", 404);
  }

  // 2. Check expiry
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    throwObject("Promocode has expired", 400);
  }

  // 3. Check usage limit
  if (promo.useCount >= promo.maxUses) {
    throwObject("Promocode has reached its usage limit", 400);
  }

  // 4. Check against cart total (minPurchase)
  const cart = await Cart.findOne({ user: userId });
  const subtotal =
    cart?.items.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;

  if (subtotal < promo.minPurchase) {
    throwObject(`Minimum purchase of ₹${promo.minPurchase} required`, 400);
  }

  // All checks passed
  res.json({
    success: true,
    message: "Promocode applied successfully!",
    data: promo,
  });
});

// --- ADMIN FUNCTIONS ---

/**
 * @desc    Create a new promocode
 * @route   POST /api/promocodes
 * @access  Admin
 */
export const createPromocode = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    maxUses,
    expiresAt,
    status,
  } = req.body;

  const promoExists = await Promocode.findOne({ code: code.toUpperCase() });
  if (promoExists) {
    throwObject("Promocode already exists", 400);
  }

  const promo = await Promocode.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount: discountType === "Percentage" ? maxDiscount : null,
    maxUses: maxUses || 1,
    expiresAt: expiresAt || null,
    status: status || "Active",
  });

  res.status(201).json({ success: true, data: promo });
});

/**
 * @desc    Get all promocodes (paginated)
 * @route   GET /api/promocodes
 * @access  Admin
 */
export const getAllPromocodes = asyncHandler(async (req, res) => {
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

  const filter = {};

  if (search) {
    filter.code = { $regex: search, $options: "i" };
  }

  if (status) filter.status = status;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Promocode.find(filter)
      .sort(sort)
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Promocode.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

/**
 * @desc    Get a single promocode
 * @route   GET /api/promocodes/:id
 * @access  Admin
 */
export const getPromocode = asyncHandler(async (req, res) => {
  const promo = await Promocode.findById(req.params.id);
  if (!promo) {
    throwObject("Promocode not found", 404);
  }
  res.json({ success: true, data: promo });
});

/**
 * @desc    Update a promocode
 * @route   PUT /api/promocodes/:id
 * @access  Admin
 */
export const updatePromocode = asyncHandler(async (req, res) => {
  const promo = await Promocode.findById(req.params.id);
  if (!promo) {
    throwObject("Promocode not found", 404);
  }

  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    maxUses,
    expiresAt,
    status,
  } = req.body;

  // Update fields
  promo.code = code.toUpperCase() || promo.code;
  promo.description = description || promo.description;
  promo.discountType = discountType || promo.discountType;
  promo.discountValue = discountValue || promo.discountValue;
  promo.minPurchase = minPurchase ?? promo.minPurchase;
  promo.maxDiscount = discountType === "Percentage" ? maxDiscount : null;
  promo.maxUses = maxUses || promo.maxUses;
  promo.expiresAt = expiresAt || promo.expiresAt;
  promo.status = status || promo.status;

  const updatedPromo = await promo.save();
  res.json({ success: true, data: updatedPromo });
});

/**
 * @desc    Delete a promocode
 * @route   DELETE /api/promocodes/:id
 * @access  Admin
 */
export const deletePromocode = asyncHandler(async (req, res) => {
  const promo = await Promocode.findById(req.params.id);
  if (!promo) {
    throwObject("Promocode not found", 404);
  }

  await promo.deleteOne(); // Use deleteOne() or remove()
  res.json({ success: true, message: "Promocode deleted" });
});

// Helper
const throwObject = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
