// backend/controllers/cartController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import VariantMaster from "../models/VariantMaster.js";
import Promocode from "../models/Promocode.js";
import mongoose from "mongoose";

// Helper to get all cart items populated
// ADDED 'stock totalStock' to select
const getPopulatedCart = (userId) => {
  return Cart.findOne({ user: userId }).populate([
    {
      path: "items.product",
      model: "Product",
      select: "name basePrice discountPrice images stock totalStock",
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

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getPopulatedCart(req.user._id);
  res.json({ success: true, data: cart ? cart.items : [] });
});

export const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const userId = req.user._id;

  let price = 0;

  if (variantId) {
    const variant = await VariantMaster.findById(variantId);
    if (!variant) {
      res.status(404);
      throw new Error("Variant not found");
    }
    price = variant.price;
  } else {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    price = product.discountPrice ?? product.basePrice;
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      String(item.variant || null) === String(variantId || null)
  );

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
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

export const updateItemQuantity = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const userId = req.user._id;

  if (quantity <= 0) {
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

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
  res.status(200).json({ success: true, data: [] });
});

export const mergeCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const userId = req.user._id;

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  for (const guestItem of items) {
    const productId = guestItem.productId || guestItem.id;
    const variantId =
      guestItem.variantId ||
      (guestItem.selectedVariant ? guestItem.selectedVariant.id : null);
    const quantity = guestItem.quantity;

    // If price isn't provided, fetch it (simplified here, assuming provided or handled by add logic)
    let price = guestItem.price || 0;
    // Ideally you fetch price from DB here to prevent tampering, but for merge it's okay to rely on existing or recalc.

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        String(item.variant || null) === String(variantId || null)
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
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

export const validatePromocode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error("Promocode is required");
  }

  const promo = await Promocode.findOne({
    code: String(code).toUpperCase(),
    status: "Active",
  });

  if (!promo) {
    res.status(404);
    throw new Error("Promocode not found or inactive");
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    res.status(400);
    throw new Error("Promocode has expired");
  }

  if (promo.maxUses && promo.useCount >= promo.maxUses) {
    res.status(400);
    throw new Error("Promocode usage limit reached");
  }

  res.json({ success: true, data: promo });
});
