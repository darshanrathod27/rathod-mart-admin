// backend/controllers/cartController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import VariantMaster from "../models/VariantMaster.js";
import Promocode from "../models/Promocode.js"; // 1. Import Promocode model
import mongoose from "mongoose";

// Helper to get all cart items populated
const getPopulatedCart = (userId) => {
  return Cart.findOne({ user: userId }).populate([
    {
      path: "items.product",
      model: "Product",
      select: "name basePrice discountPrice images",
    },
    {
      path: "items.variant",
      model: "VariantMaster",
      select: "size color price",
      populate: [
        { path: "size", select: "sizeName value" },
        { path: "color", select: "colorName value" },
      ],
    },
  ]);
};

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getPopulatedCart(req.user._id);
  res.json({ success: true, data: cart ? cart.items : [] });
});

/**
 * @desc    Add/Update item in cart
 * @route   POST /api/cart/add
 * @access  Private
 */
export const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const userId = req.user._id;

  let price = 0;
  let product = null;

  // 1. Get the price
  if (variantId) {
    const variant = await VariantMaster.findById(variantId);
    if (!variant) {
      res.status(404);
      throw new Error("Variant not found");
    }
    price = variant.price;
  } else {
    product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    price = product.discountPrice ?? product.basePrice;
  }

  // 2. Find user's cart
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // 3. Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      String(item.variant || null) === String(variantId || null)
  );

  if (existingItemIndex > -1) {
    // Item exists, update quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Item doesn't exist, add to array
    cart.items.push({
      product: productId,
      variant: variantId || null,
      quantity,
      price,
    });
  }

  await cart.save();
  const populatedCart = await getPopulatedCart(userId);
  res.status(200).json({ success: true, data: populatedCart.items });
});

/**
 * @desc    Update item quantity
 * @route   POST /api/cart/update
 * @access  Private
 */
export const updateItemQuantity = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const userId = req.user._id;

  if (quantity <= 0) {
    // Use the remove logic if quantity is 0 or less
    return removeItemFromCart(req, res);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      String(item.variant || null) === String(variantId || null)
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    const populatedCart = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populatedCart.items });
  } else {
    res.status(404);
    throw new Error("Item not found in cart");
  }
});

/**
 * @desc    Remove item from cart
 * @route   POST /api/cart/remove
 * @access  Private
 */
export const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.body;
  const userId = req.user._id;

  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    {
      $pull: {
        items: {
          product: productId,
          variant: variantId || null,
        },
      },
    },
    { new: true }
  );

  if (!cart) {
    return res.json({ success: true, data: [] });
  }

  const populatedCart = await getPopulatedCart(userId);
  res.status(200).json({ success: true, data: populatedCart.items });
});

/**
 * @desc    Clear entire cart
 * @route   POST /api/cart/clear
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
  res.status(200).json({ success: true, data: [] });
});

/**
 * @desc    Merge guest cart on login
 * @route   POST /api/cart/merge
 * @access  Private
 */
export const mergeCart = asyncHandler(async (req, res) => {
  const { items } = req.body; // Expecting full cart items array
  const userId = req.user._id;

  if (!Array.isArray(items) || items.length === 0) {
    const currentCart = await getPopulatedCart(userId);
    return res.json({
      success: true,
      data: currentCart ? currentCart.items : [],
    });
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Loop through guest items and add/update them
  for (const guestItem of items) {
    const productId = guestItem.id || guestItem.product;
    const variantId = guestItem.selectedVariant
      ? guestItem.selectedVariant.id
      : null;
    const quantity = guestItem.quantity;
    const price = guestItem.price;

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        String(item.variant || null) === String(variantId || null)
    );

    if (existingItemIndex > -1) {
      // Item exists, add quantities
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Item doesn't exist, add to array
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity: quantity,
        price: price,
      });
    }
  }

  await cart.save();
  const populatedCart = await getPopulatedCart(userId);
  res.json({ success: true, data: populatedCart.items });
});

// 2. ADD NEW FUNCTION
/**
 * @desc    Validate a promocode
 * @route   POST /api/cart/validate-promo
 * @access  Private
 */
export const validatePromocode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error("Promocode is required");
  }

  const promo = await Promocode.findOne({
    code: String(code).toUpperCase(),
    isDeleted: false,
  });

  if (!promo) {
    res.status(404);
    throw new Error("Promocode not found");
  }

  if (promo.status !== "Active") {
    res.status(400);
    throw new Error("This code is not active");
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    res.status(400);
    throw new Error("This code has expired");
  }

  if (promo.maxUses && promo.uses >= promo.maxUses) {
    res.status(400);
    throw new Error("This code has reached its usage limit");
  }

  // Note: We don't increment `uses` here.
  // We do that *after* an order is successfully placed.
  // For now, we just validate it's usable.
  res.json({ success: true, data: promo });
});
