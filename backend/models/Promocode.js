// backend/models/Promocode.js
import mongoose from "mongoose";

const promocodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
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
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    // For "Percentage" type, max discount amount
    maxDiscount: {
      type: Number,
    },
    // Total number of times this code can be used
    maxUses: {
      type: Number,
      default: 1,
    },
    // How many times this code has been used
    useCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    // FIX: Changed from isActive (Boolean) to status (String)
    // to match your frontend form
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Promocode", promocodeSchema);
