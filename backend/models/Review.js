// backend/models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    // User ID (agar logged in hai)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Ya fir guest ka naam
    userName: {
      type: String,
      default: "Guest",
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Admin approval ke liye
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast query
reviewSchema.index({ product: 1, status: 1 });

export default mongoose.model("Review", reviewSchema);
