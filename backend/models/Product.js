// backend/models/Product.js
import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  alt: { type: String, default: "" },
  isPrimary: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
  // Link image to a specific variant (if any). Null => general image.
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VariantMaster",
    default: null,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: { type: String },
    images: [imageSchema],

    // inventory/pricing
    basePrice: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number },

    // stock fields (kept up-to-date by inventory system)
    stock: { type: Number, default: 0 }, // computed by inventory
    totalStock: { type: Number, default: 0 }, // aggregate (variants or base)

    // rating and reviews
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    // meta
    tags: { type: [String], default: [] },
    features: { type: [String], default: [] },
    slug: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "draft",
    },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    isBestOffer: { type: Boolean, default: false }, // <-- ADDED THIS
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// indexes
productSchema.index({ slug: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("Product", productSchema);
