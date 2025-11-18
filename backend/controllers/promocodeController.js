// backend/controllers/promocodeController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Promocode from "../models/Promocode.js";
import Cart from "../models/Cart.js"; // To check against cart total

/**
 * @desc    Get available active promocodes for customers
 * @route   GET /api/promocodes/available
 * @access  Public
 */
export const getAvailablePromocodes = asyncHandler(async (req, res) => {
  const promos = await Promocode.find({
    status: "Active",
    expiresAt: { $gt: new Date() },
    // Optional: Add logic to hide fully used codes
  })
    .select("code description discountType discountValue minPurchase")
    .limit(5)
    .lean();

  res.json({ success: true, data: promos });
});

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
    status: "Active",
  });

  if (!promo) {
    throwObject("Promocode not found or is inactive", 404);
  }

  // 2. Check expiry
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    throwObject("Promocode has expired", 400);
  }

  // 3. Check usage limit (global uses)
  if (typeof promo.maxUses === "number" && promo.maxUses > 0) {
    if ((promo.useCount || 0) >= promo.maxUses) {
      throwObject("Promocode has reached its usage limit", 400);
    }
  }

  // 4. Check against cart total (minPurchase)
  const cart = await Cart.findOne({ user: userId });
  const subtotal =
    cart?.items?.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
      0
    ) || 0;

  if (typeof promo.minPurchase === "number" && subtotal < promo.minPurchase) {
    throwObject(`Minimum purchase of ₹${promo.minPurchase} required`, 400);
  }

  // All checks passed
  res.json({
    success: true,
    message: "Promocode applied successfully!",
    data: promo,
  });
});

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

  if (!code || !discountType || typeof discountValue === "undefined") {
    throwObject("code, discountType and discountValue are required", 400);
  }

  const promoExists = await Promocode.findOne({ code: code.toUpperCase() });
  if (promoExists) {
    throwObject("Promocode already exists", 400);
  }

  const promo = await Promocode.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minPurchase: minPurchase || 0,
    maxDiscount: discountType === "Percentage" ? maxDiscount || null : null,
    maxUses: maxUses || 0,
    useCount: 0,
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

  // Update fields (only when provided)
  if (code) promo.code = String(code).toUpperCase();
  if (typeof description !== "undefined") promo.description = description;
  if (typeof discountType !== "undefined") promo.discountType = discountType;
  if (typeof discountValue !== "undefined") promo.discountValue = discountValue;
  promo.minPurchase =
    typeof minPurchase !== "undefined" ? minPurchase : promo.minPurchase;
  promo.maxDiscount =
    discountType === "Percentage" ? maxDiscount ?? promo.maxDiscount : null;
  promo.maxUses = typeof maxUses !== "undefined" ? maxUses : promo.maxUses;
  promo.expiresAt =
    typeof expiresAt !== "undefined" ? expiresAt : promo.expiresAt;
  promo.status = typeof status !== "undefined" ? status : promo.status;

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

  await promo.deleteOne();
  res.json({ success: true, message: "Promocode deleted" });
});

// Helper to throw errors with status
const throwObject = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
