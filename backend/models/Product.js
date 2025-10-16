import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String, default: "" },
  isPrimary: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  thumbnailUrl: String,
  mediumUrl: String,
  largeUrl: String,
  uploadedAt: { type: Date, default: Date.now },
});

const variantSchema = new mongoose.Schema({
  color: {
    name: { type: String, required: true },
    code: { type: String, required: true },
  },
  size: {
    name: { type: String, required: true },
    value: String,
  },
  price: { type: Number, required: true },
  discountPrice: Number,
  stock: { type: Number, required: true },
  sku: { type: String, unique: true, sparse: true },
  images: [imageSchema],
  isActive: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: String,
    images: [imageSchema],
    variants: [variantSchema],
    basePrice: { type: Number, required: true },
    discountPrice: Number,
    tags: [String],
    features: [String],
    specifications: [
      {
        key: String,
        value: String,
      },
    ],
    seoTitle: String,
    seoDescription: String,
    slug: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "draft",
    },
    totalStock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ featured: 1 });

export default mongoose.model("Product", productSchema);
