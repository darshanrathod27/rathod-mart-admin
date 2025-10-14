// backend/models/ProductImage.js - Enhanced model
import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    fullImageUrl: {
      type: String,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    size: {
      type: Number,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    altText: {
      type: String,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
productImageSchema.index({ product: 1, isPrimary: -1 });

export default mongoose.model("ProductImage", productImageSchema);
