// backend/controllers/promocodeController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Promocode from "../models/Promocode.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js"; // Import Product to check basePrice

export const validatePromocode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;

  if (!code) throw new Error("Promocode is required");

  const promo = await Promocode.findOne({
    code: code.toUpperCase(),
    status: "Active",
  });

  if (!promo) {
    res.status(404);
    throw new Error("Promocode not found or is inactive");
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    res.status(400);
    throw new Error("Promocode has expired");
  }

  if (typeof promo.maxUses === "number" && promo.maxUses > 0) {
    if ((promo.useCount || 0) >= promo.maxUses) {
      res.status(400);
      throw new Error("Promocode usage limit reached");
    }
  }

  // CHECK MIN PURCHASE AGAINST BASE PRICE (GROSS TOTAL)
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  let cartTotal = 0;

  if (cart && cart.items) {
    // Calculate total based on Product Base Price to be fair to user
    cartTotal = cart.items.reduce((acc, item) => {
      // Use product base price if available, otherwise fallback to stored price
      const priceToCheck = item.product?.basePrice || item.price || 0;
      return acc + priceToCheck * item.quantity;
    }, 0);
  }

  if (typeof promo.minPurchase === "number" && cartTotal < promo.minPurchase) {
    res.status(400);
    throw new Error(
      `Minimum purchase of ₹${promo.minPurchase} required (Total: ₹${cartTotal})`
    );
  }

  res.json({
    success: true,
    message: "Promocode applied successfully!",
    data: promo,
  });
});

// ... (Rest of CRUD controllers remain same)
export const createPromocode = asyncHandler(async (req, res) => {
  // ... (standard create logic)
  const exists = await Promocode.findOne({ code: req.body.code.toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error("Code exists");
  }
  const promo = await Promocode.create(req.body);
  res.status(201).json({ success: true, data: promo });
});

export const getAllPromocodes = asyncHandler(async (req, res) => {
  // ... (standard list logic)
  const { search } = req.query;
  const filter = {};
  if (search) filter.code = { $regex: search, $options: "i" };
  const promos = await Promocode.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: promos });
});

export const getAvailablePromocodes = asyncHandler(async (req, res) => {
  const promos = await Promocode.find({ status: "Active" }).limit(5);
  res.json({ success: true, data: promos });
});

export const getPromocode = asyncHandler(async (req, res) => {
  const p = await Promocode.findById(req.params.id);
  if (!p) throw new Error("Not found");
  res.json({ success: true, data: p });
});

export const updatePromocode = asyncHandler(async (req, res) => {
  const p = await Promocode.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json({ success: true, data: p });
});

export const deletePromocode = asyncHandler(async (req, res) => {
  await Promocode.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
});
