// backend/controllers/promocodeController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Promocode from "../models/Promocode.js";

// @desc    Get all promocodes (paginated, search, filter)
// @route   GET /api/promocodes
// @access  Admin
export const getPromocodes = asyncHandler(async (req, res) => {
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

  if (search) {
    filter.code = { $regex: search, $options: "i" };
  }
  if (status) filter.status = status;

  const allowSort = new Set([
    "code",
    "status",
    "createdAt",
    "expiresAt",
    "discountValue",
    "uses",
  ]);
  const key = allowSort.has(sortBy) ? sortBy : "createdAt";
  const dir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Promocode.find(filter)
      .sort({ [key]: dir })
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

// @desc    Get single promocode
// @route   GET /api/promocodes/:id
// @access  Admin
export const getPromocodeById = asyncHandler(async (req, res) => {
  const item = await Promocode.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!item) {
    const e = new Error("Promocode not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: item });
});

// @desc    Create new promocode
// @route   POST /api/promocodes
// @access  Admin
export const createPromocode = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    expiresAt,
    status,
    maxUses,
  } = req.body;

  const exists = await Promocode.findOne({
    code,
    isDeleted: false,
  });
  if (exists) {
    const e = new Error("This promocode already exists");
    e.statusCode = 409;
    throw e;
  }

  const promo = await Promocode.create({
    code,
    description,
    discountType,
    discountValue: Number(discountValue),
    minPurchase: Number(minPurchase) || 0,
    maxDiscount:
      discountType === "Percentage" ? Number(maxDiscount) || null : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    status: status || "Active",
    maxUses: Number(maxUses) || null,
  });

  res.status(201).json({ success: true, data: promo });
});

// @desc    Update promocode
// @route   PUT /api/promocodes/:id
// @access  Admin
export const updatePromocode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    expiresAt,
    status,
    maxUses,
  } = req.body;

  const item = await Promocode.findOne({ _id: id, isDeleted: false });
  if (!item) {
    const e = new Error("Promocode not found");
    e.statusCode = 404;
    throw e;
  }

  // Check if code is being changed and if it conflicts
  if (code && code !== item.code) {
    const exists = await Promocode.findOne({
      code,
      _id: { $ne: id },
      isDeleted: false,
    });
    if (exists) {
      const e = new Error("This promocode already exists");
      e.statusCode = 409;
      throw e;
    }
    item.code = code;
  }

  // Update fields
  item.description = description !== undefined ? description : item.description;
  item.discountType = discountType || item.discountType;
  item.discountValue =
    discountValue !== undefined ? Number(discountValue) : item.discountValue;
  item.minPurchase =
    minPurchase !== undefined ? Number(minPurchase) : item.minPurchase;
  item.maxDiscount =
    maxDiscount !== undefined ? Number(maxDiscount) || null : item.maxDiscount;
  item.expiresAt = expiresAt ? new Date(expiresAt) : null;
  item.status = status || item.status;
  item.maxUses = maxUses !== undefined ? Number(maxUses) || null : item.maxUses;

  // if type changed to Fixed, remove maxDiscount
  if (item.discountType === "Fixed") {
    item.maxDiscount = null;
  }

  const updatedItem = await item.save();
  res.json({ success: true, data: updatedItem });
});

// @desc    Delete promocode (soft)
// @route   DELETE /api/promocodes/:id
// @access  Admin
export const deletePromocode = asyncHandler(async (req, res) => {
  const item = await Promocode.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!item) {
    const e = new Error("Promocode not found");
    e.statusCode = 404;
    throw e;
  }

  await Promocode.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
    status: "Inactive",
  });

  res.json({ success: true, message: "Promocode deleted" });
});
