// backend/controllers/wishlistController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js"; // We need Product to validate IDs
import mongoose from "mongoose";

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate({
      path: "products",
      model: "Product",
    })
    .lean(); // Use .lean() for faster read-only queries

  if (wishlist) {
    res.json({ success: true, data: wishlist.products });
  } else {
    // If user has no wishlist yet, return empty array
    res.json({ success: true, data: [] });
  }
});

/**
 * @desc    Add item to wishlist
 * @route   POST /api/wishlist/add
 * @access  Private
 */
export const addItemToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid Product ID");
  }

  // Find user's wishlist or create a new one if it doesn't exist
  // $addToSet automatically handles duplicates (won't add if it already exists)
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { new: true, upsert: true } // new: returns modified doc, upsert: creates if doesn't exist
  ).populate("products");

  res.status(200).json({ success: true, data: wishlist.products });
});

/**
 * @desc    Remove item from wishlist
 * @route   POST /api/wishlist/remove
 * @access  Private
 */
export const removeItemFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid Product ID");
  }

  // Find user's wishlist and $pull (remove) the productId
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true }
  ).populate("products");

  if (!wishlist) {
    // This case should be rare due to upsert on add, but good to have
    res.json({ success: true, data: [] });
  } else {
    res.status(200).json({ success: true, data: wishlist.products });
  }
});

/**
 * @desc    Merge guest wishlist with user's DB wishlist on login
 * @route   POST /api/wishlist/merge
 * @access  Private
 */
export const mergeWishlist = asyncHandler(async (req, res) => {
  const { items } = req.body; // Expecting an array of product IDs
  const userId = req.user._id;

  if (!Array.isArray(items) || items.length === 0) {
    // If no items to merge, just return current wishlist
    const currentWishlist = await Wishlist.findOne({ user: userId }).populate(
      "products"
    );
    return res.json({
      success: true,
      data: currentWishlist ? currentWishlist.products : [],
    });
  }

  // Add all items from the guest cart to the user's wishlist
  // $addToSet will ignore any duplicates
  const updatedWishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: { $each: items } } },
    { new: true, upsert: true }
  ).populate("products");

  res.json({ success: true, data: updatedWishlist.products });
});
