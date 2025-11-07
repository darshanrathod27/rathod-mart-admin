// backend/models/InventoryLedger.js
import mongoose from "mongoose";

const inventoryLedgerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VariantMaster",
      default: null,
    },
    referenceType: { type: String, enum: ["Purchase", "Sale"], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    quantity: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ["IN", "OUT"], required: true },
    balanceStock: { type: Number, required: true, min: 0 },
    remarks: { type: String, default: "", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

inventoryLedgerSchema.index({ product: 1, variant: 1, createdAt: -1 });
inventoryLedgerSchema.index({ product: 1 });
inventoryLedgerSchema.index({ variant: 1 });
inventoryLedgerSchema.index({ referenceType: 1, createdAt: -1 });
inventoryLedgerSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model("InventoryLedger", inventoryLedgerSchema);
