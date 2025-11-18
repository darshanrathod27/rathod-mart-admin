// backend/controllers/inventoryController.js
import mongoose from "mongoose";
import InventoryLedger from "../models/InventoryLedger.js";
import Product from "../models/Product.js";
import VariantMaster from "../models/VariantMaster.js";
import asyncHandler from "../middleware/asyncHandler.js"; // keep your project's async wrapper

/**
 * Helper: get current stock.
 * If variantId is provided -> variant-level latest balanceStock (IN - OUT tracked in ledger)
 * If variantId is null -> base product stock ledger (variant null)
 */
const getCurrentStock = async (productId, variantId = null) => {
  const q = { product: productId };
  if (variantId) q.variant = variantId;
  else q.variant = { $in: [null, undefined] };

  // Use latest ledger entry's balanceStock if present (your model has balanceStock)
  const latest = await InventoryLedger.findOne(q)
    .sort({ createdAt: -1 })
    .select("balanceStock")
    .lean();
  return latest?.balanceStock ?? 0;
};

/**
 * Helper: recalc product total stock = sum of all variants currentStock + base product stock (if no variants)
 */
const updateProductTotalStock = async (productId) => {
  const variants = await VariantMaster.find({
    product: productId,
    isDeleted: false,
  })
    .select("_id")
    .lean();

  let total = 0;

  if (variants.length > 0) {
    for (const v of variants) {
      // eslint-disable-next-line no-await-in-loop
      const vs = await getCurrentStock(productId, v._id);
      total += Number(vs || 0);
    }
  } else {
    // no variants -> take base product stock ledger (variant null)
    total = Number((await getCurrentStock(productId, null)) || 0);
  }

  await Product.findByIdAndUpdate(productId, { stock: total }, { new: true });
  return total;
};

/* ---------------- Add stock (body-based payload: { product, variant, quantity, remarks }) ---------------- */
export const addStock = asyncHandler(async (req, res) => {
  const { product, variant, quantity, remarks } = req.body;

  if (!product || !quantity || Number(quantity) <= 0) {
    const e = new Error("Product and valid quantity required");
    e.statusCode = 400;
    throw e;
  }

  const prod = await Product.findById(product);
  if (!prod) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  if (variant) {
    const varDoc = await VariantMaster.findById(variant);
    if (!varDoc || varDoc.product.toString() !== product.toString()) {
      const e = new Error("Variant mismatch");
      e.statusCode = 400;
      throw e;
    }
  }

  // compute new balanceStock (use latest balanceStock if stored; fallback to arithmetic)
  const current = await getCurrentStock(product, variant || null);
  const newStock = Number(current) + Number(quantity);

  const ledger = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Purchase",
    referenceId: null,
    quantity: Number(quantity),
    type: "IN",
    balanceStock: newStock,
    remarks: remarks || "Stock added",
    createdBy: req.user?._id || null,
  });

  await updateProductTotalStock(product);

  res.status(201).json({ success: true, message: "Stock added", data: ledger });
});

/* ---------------- Reduce stock (body-based payload: { product, variant, quantity, remarks }) ---------------- */
export const reduceStock = asyncHandler(async (req, res) => {
  const { product, variant, quantity, remarks } = req.body;

  if (!product || !quantity || Number(quantity) <= 0) {
    const e = new Error("Product and valid quantity required");
    e.statusCode = 400;
    throw e;
  }

  const prod = await Product.findById(product);
  if (!prod) {
    const e = new Error("Product not found");
    e.statusCode = 404;
    throw e;
  }

  if (variant) {
    const varDoc = await VariantMaster.findById(variant);
    if (!varDoc || varDoc.product.toString() !== product.toString()) {
      const e = new Error("Variant mismatch");
      e.statusCode = 400;
      throw e;
    }
  }

  const current = await getCurrentStock(product, variant || null);
  if (Number(current) < Number(quantity)) {
    const e = new Error(`Insufficient stock. Available: ${current}`);
    e.statusCode = 400;
    throw e;
  }

  const newStock = Number(current) - Number(quantity);

  const ledger = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Sale",
    referenceId: null,
    quantity: Number(quantity),
    type: "OUT",
    balanceStock: newStock,
    remarks: remarks || "Stock reduced",
    createdBy: req.user?._id || null,
  });

  await updateProductTotalStock(product);

  res
    .status(201)
    .json({ success: true, message: "Stock reduced", data: ledger });
});

/* ---------------- Inventory ledger (with filters) ----------------
   Query shape: ?page=1&limit=50&filters[product]=...&filters[variant]=...&filters[type]=IN
*/
export const getInventoryLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const filters = req.query.filters || {};
  const query = {};

  if (filters.product) query.product = filters.product;
  if (filters.variant) query.variant = filters.variant;
  if (filters.type) query.type = filters.type;

  const skip = (Number(page) - 1) * Number(limit);

  const [ledgers, total] = await Promise.all([
    InventoryLedger.find(query)
      .populate("product", "name")
      .populate({
        path: "variant",
        populate: [{ path: "size" }, { path: "color" }],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    InventoryLedger.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      ledgers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/* ---------------- Get product variants with currentStock attached ----------------
   Route expectation: either GET /api/inventory/:productId/variants or similar
   (this handler expects req.params.productId)
*/
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
    variants.map(async (v) => ({
      ...v,
      currentStock: await getCurrentStock(productId, v._id),
    }))
  );

  res.json({ success: true, data: withStock });
});

/* ---------------- Stock summary (purchases/sales/current) ----------------
   GET /api/inventory/:productId/stock-summary
*/
export const getStockSummary = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const objectIdProductId = new mongoose.Types.ObjectId(productId);

  const [totalInAgg, totalOutAgg, product] = await Promise.all([
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "IN" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "OUT" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    Product.findById(productId).select("stock").lean(),
  ]);

  res.json({
    success: true,
    data: {
      totalPurchase: totalInAgg[0]?.total || 0,
      totalSale: totalOutAgg[0]?.total || 0,
      currentStock: product?.stock || 0,
    },
  });
});
