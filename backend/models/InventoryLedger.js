import mongoose from "mongoose";

const inventoryLedgerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VariantMaster",
      default: null,
    },
    referenceType: {
      type: String,
      enum: ["Purchase", "Sale"],
      required: [true, "Reference type is required"],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: [true, "Type is required"],
    },
    balanceStock: {
      type: Number,
      required: [true, "Balance stock is required"],
      min: [0, "Balance stock cannot be negative"],
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Remove duplicate index declarations
inventoryLedgerSchema.index({ product: 1, variant: 1, createdAt: -1 });
inventoryLedgerSchema.index({ product: 1 });
inventoryLedgerSchema.index({ variant: 1 });
inventoryLedgerSchema.index({ referenceType: 1, createdAt: -1 });
inventoryLedgerSchema.index({ type: 1, createdAt: -1 });

const InventoryLedger = mongoose.model(
  "InventoryLedger",
  inventoryLedgerSchema
);

export default InventoryLedger;
