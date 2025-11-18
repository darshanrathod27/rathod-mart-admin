// backend/controllers/inventoryController.js
import mongoose from "mongoose";
import InventoryLedger from "../models/InventoryLedger.js";
import Product from "../models/Product.js";
import VariantMaster from "../models/VariantMaster.js";
import asyncHandler from "../middleware/asyncHandler.js";

/**
 * ------------------------------------------------------------------
 * HELPER FUNCTIONS
 * ------------------------------------------------------------------
 */

/**
 * Get the current stock balance for a specific Product + Variant combination.
 * It reads the 'balanceStock' from the very last ledger entry.
 */
const getCurrentStock = async (productId, variantId = null) => {
  const query = { product: productId };

  // Explicitly handle null vs populated variant ID
  if (variantId) {
    query.variant = variantId;
  } else {
    query.variant = { $in: [null, undefined] };
  }

  const latestEntry = await InventoryLedger.findOne(query)
    .sort({ createdAt: -1 }) // Get the newest entry
    .select("balanceStock")
    .lean();

  return latestEntry?.balanceStock ? Number(latestEntry.balanceStock) : 0;
};

/**
 * Recalculate the TOTAL stock for a product and update the Product document.
 * This ensures the Admin Panel product table shows the live, correct count
 * derived from all variants (or the base item).
 */
const updateProductTotalStock = async (productId) => {
  // 1. Find all active variants for this product
  const variants = await VariantMaster.find({
    product: productId,
    isDeleted: false,
  })
    .select("_id")
    .lean();

  let totalCalculatedStock = 0;

  if (variants.length > 0) {
    // Case A: Product has variants -> Sum up stock of all variants
    for (const v of variants) {
      const variantStock = await getCurrentStock(productId, v._id);
      totalCalculatedStock += Number(variantStock);
    }
  } else {
    // Case B: Single Product -> Get stock of base item (null variant)
    totalCalculatedStock = await getCurrentStock(productId, null);
  }

  // 2. Update the Product document immediately so Admin Panel sees live data
  // We update BOTH 'stock' and 'totalStock' to cover all frontend logic cases
  await Product.findByIdAndUpdate(
    productId,
    {
      stock: Number(totalCalculatedStock),
      totalStock: Number(totalCalculatedStock),
    },
    { new: true }
  );

  return totalCalculatedStock;
};

/**
 * ------------------------------------------------------------------
 * CONTROLLERS
 * ------------------------------------------------------------------
 */

/* * Add Stock (Purchase/Restock)
 * Updates Ledger AND Product Total immediately
 */
export const addStock = asyncHandler(async (req, res) => {
  const { product, variant, quantity, remarks } = req.body;

  // Basic Validation
  if (!product || !quantity || Number(quantity) <= 0) {
    const e = new Error("Product and a valid positive quantity are required");
    e.statusCode = 400;
    throw e;
  }

  const prodExists = await Product.findById(product);
  if (!prodExists) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  // Validate Variant if provided
  if (variant) {
    const varDoc = await VariantMaster.findById(variant);
    if (!varDoc || varDoc.product.toString() !== product.toString()) {
      const e = new Error("Invalid variant for this product");
      e.statusCode = 400;
      throw e;
    }
  }

  // 1. Calculate New Balance
  const currentBalance = await getCurrentStock(product, variant || null);
  const newBalance = Number(currentBalance) + Number(quantity);

  // 2. Create Ledger Entry (The Source of Truth)
  const ledger = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Purchase", // or "Adjustment"
    referenceId: null,
    quantity: Number(quantity),
    type: "IN",
    balanceStock: newBalance,
    remarks: remarks || "Stock added via Admin",
    createdBy: req.user?._id || null,
  });

  // 3. Sync Product Model Total
  const updatedTotal = await updateProductTotalStock(product);

  res.status(201).json({
    success: true,
    message: "Stock added successfully",
    data: ledger,
    currentProductStock: updatedTotal,
  });
});

/* * Reduce Stock (Sale/Damage/Correction)
 * Checks availability -> Updates Ledger -> Updates Product Total
 */
export const reduceStock = asyncHandler(async (req, res) => {
  const { product, variant, quantity, remarks } = req.body;

  if (!product || !quantity || Number(quantity) <= 0) {
    const e = new Error("Product and a valid positive quantity are required");
    e.statusCode = 400;
    throw e;
  }

  const prodExists = await Product.findById(product);
  if (!prodExists) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  if (variant) {
    const varDoc = await VariantMaster.findById(variant);
    if (!varDoc || varDoc.product.toString() !== product.toString()) {
      const e = new Error("Invalid variant");
      e.statusCode = 400;
      throw e;
    }
  }

  // 1. Check Availability
  const currentBalance = await getCurrentStock(product, variant || null);
  if (Number(currentBalance) < Number(quantity)) {
    const e = new Error(
      `Insufficient stock! Current available: ${currentBalance}`
    );
    e.statusCode = 400;
    throw e;
  }

  // 2. Calculate New Balance
  const newBalance = Number(currentBalance) - Number(quantity);

  // 3. Create Ledger Entry
  const ledger = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Sale", // or "Correction"
    referenceId: null,
    quantity: Number(quantity),
    type: "OUT",
    balanceStock: newBalance,
    remarks: remarks || "Stock reduced via Admin",
    createdBy: req.user?._id || null,
  });

  // 4. Sync Product Model Total
  const updatedTotal = await updateProductTotalStock(product);

  res.status(201).json({
    success: true,
    message: "Stock reduced successfully",
    data: ledger,
    currentProductStock: updatedTotal,
  });
});

/* * Get Inventory Ledger History
 * Supports pagination and filters for Product, Variant, Type (IN/OUT)
 */
export const getInventoryLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  // Construct Query
  const query = {};
  // Check if filters are passed as a string (JSON) or object
  const filters =
    typeof req.query.filters === "string"
      ? JSON.parse(req.query.filters)
      : req.query.filters || {};

  if (filters.product) query.product = filters.product;
  if (filters.variant) query.variant = filters.variant;
  if (filters.type) query.type = filters.type;

  const p = Math.max(parseInt(page), 1);
  const l = Math.max(parseInt(limit), 1);
  const skip = (p - 1) * l;

  const [ledgers, total] = await Promise.all([
    InventoryLedger.find(query)
      .populate("product", "name")
      .populate({
        path: "variant",
        populate: [
          { path: "size", select: "sizeName" },
          { path: "color", select: "colorName value" },
        ],
      })
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(l)
      .lean(),
    InventoryLedger.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      ledgers,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l),
      },
    },
  });
});

/* * Get Variants for a Product with their LIVE Current Stock
 */
export const getProductVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // 1. Get all active variants
  const variants = await VariantMaster.find({
    product: productId,
    isDeleted: false,
    status: "Active",
  })
    .populate("size", "sizeName value")
    .populate("color", "colorName value")
    .sort({ createdAt: -1 })
    .lean();

  // 2. Attach live calculated stock to each variant
  const withStock = await Promise.all(
    variants.map(async (v) => {
      const liveStock = await getCurrentStock(productId, v._id);
      return {
        ...v,
        currentStock: liveStock, // This is the number the UI needs
      };
    })
  );

  res.json({ success: true, data: withStock });
});

/* * Get Stock Summary (Dashboard/Analytics usage)
 */
export const getStockSummary = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const objectIdProductId = new mongoose.Types.ObjectId(productId);

  const [totalInAgg, totalOutAgg, productDoc] = await Promise.all([
    // Sum of all IN
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "IN" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    // Sum of all OUT
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "OUT" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    // Current Snapshot from Product Collection
    Product.findById(productId).select("stock totalStock").lean(),
  ]);

  // Fallback to calculation if Product doc isn't perfectly synced yet
  const liveStock = productDoc?.totalStock ?? productDoc?.stock ?? 0;

  res.json({
    success: true,
    data: {
      totalPurchase: totalInAgg[0]?.total || 0,
      totalSale: totalOutAgg[0]?.total || 0,
      currentStock: liveStock,
    },
  });
});
