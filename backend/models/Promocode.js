// backend/models/Promocode.js
import mongoose from "mongoose";

const promocodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Promocode is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: 0,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number, // Only applicable for 'Percentage' type
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
    uses: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

promocodeSchema.index({ code: 1, status: 1, expiresAt: 1 });
promocodeSchema.index({ isDeleted: 1 });

export default mongoose.model("Promocode", promocodeSchema);
