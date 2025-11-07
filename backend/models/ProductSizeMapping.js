// backend/models/ProductSizeMapping.js
import mongoose from "mongoose";

const productSizeMappingSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      index: true,
    },
    sizeName: {
      type: String,
      required: [true, "Size name is required"],
      trim: true,
      maxlength: [50, "Size name cannot exceed 50 characters"],
    },
    value: {
      type: String,
      required: [true, "Size value is required"],
      trim: true,
      maxlength: [20, "Size value cannot exceed 20 characters"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSizeMappingSchema.index({ product: 1, sizeName: 1 }, { unique: true });
productSizeMappingSchema.index({ isDeleted: 1 });

const ProductSizeMapping = mongoose.model(
  "ProductSizeMapping",
  productSizeMappingSchema
);

export default ProductSizeMapping;
