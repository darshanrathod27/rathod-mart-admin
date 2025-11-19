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

const getCurrentStock = async (productId, variantId = null) => {
  const query = { product: productId };

  if (variantId) {
    query.variant = variantId;
  } else {
    query.variant = { $in: [null, undefined] };
  }

  const latestEntry = await InventoryLedger.findOne(query)
    .sort({ createdAt: -1 })
    .select("balanceStock")
    .lean();

  return latestEntry?.balanceStock ? Number(latestEntry.balanceStock) : 0;
};

const updateProductTotalStock = async (productId) => {
  const variants = await VariantMaster.find({
    product: productId,
    isDeleted: false,
  })
    .select("_id")
    .lean();

  let totalCalculatedStock = 0;

  if (variants.length > 0) {
    for (const v of variants) {
      const variantStock = await getCurrentStock(productId, v._id);
      totalCalculatedStock += Number(variantStock);
    }
  } else {
    totalCalculatedStock = await getCurrentStock(productId, null);
  }

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
 * INTERNAL FUNCTION (For Order Controller)
 * ------------------------------------------------------------------
 */
export const reduceStockInternal = async (
  product,
  variant,
  quantity,
  referenceId
) => {
  // 1. Check Availability
  const currentBalance = await getCurrentStock(product, variant || null);

  if (Number(currentBalance) < Number(quantity)) {
    throw new Error(
      `Insufficient stock for Product ID: ${product}. Available: ${currentBalance}`
    );
  }

  // 2. Calculate New Balance
  const newBalance = Number(currentBalance) - Number(quantity);

  // 3. Create Ledger Entry
  await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Sale",
    referenceId: referenceId, // Order ID
    quantity: Number(quantity),
    type: "OUT",
    balanceStock: newBalance,
    remarks: `Order Placed #${referenceId}`,
    createdBy: null, // System generated
  });

  // 4. Sync Product Model Total
  await updateProductTotalStock(product);
};

/**
 * ------------------------------------------------------------------
 * CONTROLLERS
 * ------------------------------------------------------------------
 */

export const addStock = asyncHandler(async (req, res) => {
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
      const e = new Error("Invalid variant for this product");
      e.statusCode = 400;
      throw e;
    }
  }

  const currentBalance = await getCurrentStock(product, variant || null);
  const newBalance = Number(currentBalance) + Number(quantity);

  const ledger = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Purchase",
    referenceId: null,
    quantity: Number(quantity),
    type: "IN",
    balanceStock: newBalance,
    remarks: remarks || "Stock added via Admin",
    createdBy: req.user?._id || null,
  });

  const updatedTotal = await updateProductTotalStock(product);

  res.status(201).json({
    success: true,
    message: "Stock added successfully",
    data: ledger,
    currentProductStock: updatedTotal,
  });
});

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

  const currentBalance = await getCurrentStock(product, variant || null);
  if (Number(currentBalance) < Number(quantity)) {
    const e = new Error(
      `Insufficient stock! Current available: ${currentBalance}`
    );
    e.statusCode = 400;
    throw e;
  }

  const newBalance = Number(currentBalance) - Number(quantity);

  const ledger = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Sale",
    referenceId: null,
    quantity: Number(quantity),
    type: "OUT",
    balanceStock: newBalance,
    remarks: remarks || "Stock reduced via Admin",
    createdBy: req.user?._id || null,
  });

  const updatedTotal = await updateProductTotalStock(product);

  res.status(201).json({
    success: true,
    message: "Stock reduced successfully",
    data: ledger,
    currentProductStock: updatedTotal,
  });
});

export const getInventoryLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const query = {};
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    InventoryLedger.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      ledgers,
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
    },
  });
});

export const getProductVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variants = await VariantMaster.find({
    product: productId,
    isDeleted: false,
    status: "Active",
  })
    .populate("size", "sizeName value")
    .populate("color", "colorName value")
    .sort({ createdAt: -1 })
    .lean();

  const withStock = await Promise.all(
    variants.map(async (v) => {
      const liveStock = await getCurrentStock(productId, v._id);
      return { ...v, currentStock: liveStock };
    })
  );

  res.json({ success: true, data: withStock });
});

export const getStockSummary = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const objectIdProductId = new mongoose.Types.ObjectId(productId);

  const [totalInAgg, totalOutAgg, productDoc] = await Promise.all([
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "IN" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "OUT" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    Product.findById(productId).select("stock totalStock").lean(),
  ]);

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
