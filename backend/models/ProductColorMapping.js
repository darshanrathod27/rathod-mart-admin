import mongoose from "mongoose";

const productColorMappingSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    colorName: {
      type: String,
      required: [true, "Color name is required"],
      trim: true,
      maxlength: [50, "Color name cannot exceed 50 characters"],
    },
    value: {
      type: String,
      required: [true, "Color value is required"],
      trim: true,
      match: [/^#[0-9A-F]{6}$/i, "Color value must be a valid hex color code"],
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

// Compound index for product and color
productColorMappingSchema.index({ product: 1, colorName: 1 });
productColorMappingSchema.index({ status: 1 });
productColorMappingSchema.index({ isDeleted: 1 });

const ProductColorMapping = mongoose.model(
  "ProductColorMapping",
  productColorMappingSchema
);

export default ProductColorMapping;
