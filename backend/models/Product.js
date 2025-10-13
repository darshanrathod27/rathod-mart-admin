import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true, sparse: true },
    brand: { type: String, trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    icon: { type: String, default: "📦" },
    color: { type: String, default: "#4CAF50" },
    slug: { type: String, lowercase: true, sparse: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    // Simplified fields from your previous model
    company: { type: String, trim: true },
    place: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual("images", {
  ref: "ProductImage",
  localField: "_id",
  foreignField: "product",
});

productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!this.sku) {
      const prefix = this.name.substring(0, 3).toUpperCase();
      this.sku = `${prefix}-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Indexes
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
