import mongoose from "mongoose";

const productSizeMappingSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
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
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for product and size
productSizeMappingSchema.index({ product: 1, sizeName: 1 });
productSizeMappingSchema.index({ status: 1 });
productSizeMappingSchema.index({ isDeleted: 1 });

const ProductSizeMapping = mongoose.model(
  "ProductSizeMapping",
  productSizeMappingSchema
);

export default ProductSizeMapping;
