// backend/controllers/reviewController.js
import asyncHandler from "../utils/asyncHandler.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

/**
 * @desc Helper function to update product's average rating and review count
 * @param {string} productId
 */
const updateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: "Approved", // Sirf approved reviews count honge
        },
      },
      {
        $group: {
          _id: "$product",
          reviewCount: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    let rating = 0;
    let reviewCount = 0;

    if (stats.length > 0) {
      reviewCount = stats[0].reviewCount;
      rating = Math.round(stats[0].avgRating * 10) / 10; // Round to 1 decimal place
    }

    // Update the product
    await Product.findByIdAndUpdate(productId, {
      rating: rating,
      reviewCount: reviewCount,
    });
  } catch (error) {
    console.error(`Failed to update product rating for ${productId}:`, error);
  }
};

/**
 * @desc    Create a new review for a product
 * @route   POST /api/reviews/:productId
 * @access  Public (ya fir Private agar user login hai)
 */
export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment, userName } = req.body;
  // const userId = req.user?._id || null; // Agar user auth hota

  const product = await Product.findById(productId);
  if (!product) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  // Optional: Check agar user ne pehle hi review kiya hai
  // const alreadyReviewed = await Review.findOne({ product: productId, user: userId });
  // if (alreadyReviewed) { ... }

  const review = await Review.create({
    product: productId,
    rating: Number(rating),
    comment,
    userName: userName || "Guest", // Guest fallback
    // user: userId,
    // --- MODIFIED --- (Auto-approve reviews for now)
    status: "Approved", // Default status, admin ko approve karna padega
  });

  // --- NEW ---
  // Review create hote hi product rating update karein
  await updateProductRating(productId);

  res.status(201).json({
    success: true,
    message: "Review submitted successfully.",
    data: review,
  });
});

/**
 * @desc    Get all APPROVED reviews for a single product
 * @route   GET /api/reviews/:productId
 * @access  Public
 */
export const getReviewsForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const filter = {
    product: productId,
    status: "Approved", // Sirf approved reviews customer ko dikhenge
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      // .populate("user", "name profileImage") // User ko populate karein agar login system hai
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

// --- ADMIN CONTROLLERS (Aapke Admin Panel ke liye) ---

/**
 * @desc    Get all reviews (for admin)
 * @route   GET /api/reviews
 * @access  Admin
 */
export const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = "", productId = "" } = req.query;

  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

  const filter = {};
  if (status) filter.status = status;
  if (productId) filter.product = productId;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("product", "name")
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

/**
 * @desc    Update review status (Approve/Reject)
 * @route   PUT /api/reviews/:reviewId/status
 * @access  Admin
 */
export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    const e = new Error("Invalid status");
    e.statusCode = 400;
    throw e;
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    const e = new Error("Review not found");
    e.statusCode = 404;
    throw e;
  }

  review.status = status;
  await review.save();

  // Status change hone ke baad product rating update karein
  await updateProductRating(review.product);

  res.json({ success: true, message: "Review status updated", data: review });
});

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:reviewId
 * @access  Admin
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review) {
    const e = new Error("Review not found");
    e.statusCode = 404;
    throw e;
  }

  const productId = review.product;
  await Review.findByIdAndDelete(reviewId);

  // Review delete hone ke baad product rating update karein
  await updateProductRating(productId);

  res.json({ success: true, message: "Review deleted" });
});
