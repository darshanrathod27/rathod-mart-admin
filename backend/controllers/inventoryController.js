import mongoose from "mongoose";
import InventoryLedger from "../models/InventoryLedger.js";
import Product from "../models/Product.js";
import VariantMaster from "../models/VariantMaster.js";
import asyncHandler from "../middleware/asyncHandler.js";

// Helper function to get current stock from ledger
const getCurrentStock = async (productId, variantId = null) => {
  const query = { product: productId };
  if (variantId) {
    query.variant = variantId;
  } else {
    query.variant = { $in: [null, undefined] };
  }

  const latestEntry = await InventoryLedger.findOne(query)
    .sort({ createdAt: -1 })
    .select("balanceStock");

  return latestEntry?.balanceStock || 0;
};

// New helper to update the total stock on the parent Product model
const updateProductTotalStock = async (productId) => {
  const variants = await VariantMaster.find({
    product: productId,
    isDeleted: false,
  });

  let totalStock = 0;

  // Sum stock of all variants
  for (const variant of variants) {
    const variantStock = await getCurrentStock(productId, variant._id);
    totalStock += variantStock;
  }

  // Add stock of the base product (if it's managed separately without variants)
  if (variants.length === 0) {
    const baseProductStock = await getCurrentStock(productId, null);
    totalStock += baseProductStock;
  }

  // Update the stock field on the Product document
  await Product.findByIdAndUpdate(productId, { stock: totalStock });
};

// @desc Add stock to inventory (Purchase)
// @route POST /api/inventory/add-stock
// @access Private
export const addStock = asyncHandler(async (req, res) => {
  const { product, variant, quantity, remarks } = req.body;

  if (!product || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Product and a valid quantity are required");
  }

  const productDoc = await Product.findById(product);
  if (!productDoc) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (variant) {
    const variantDoc = await VariantMaster.findById(variant);
    if (!variantDoc || variantDoc.product.toString() !== product) {
      res.status(400);
      throw new Error("Variant not found or does not belong to this product");
    }
  }

  const currentStock = await getCurrentStock(product, variant);
  const newStock = currentStock + Number(quantity);

  const ledgerEntry = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Purchase",
    quantity: Number(quantity),
    type: "IN",
    balanceStock: newStock,
    remarks: remarks || "Stock added from inventory master",
    createdBy: req.user?._id,
  });

  await updateProductTotalStock(product);

  res.status(201).json({
    success: true,
    message: "Stock added successfully",
    data: ledgerEntry,
  });
});

// @desc Reduce stock from inventory (Sale)
// @route POST /api/inventory/reduce-stock
// @access Private
export const reduceStock = asyncHandler(async (req, res) => {
  const { product, variant, quantity, remarks } = req.body;

  if (!product || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Product and a valid quantity are required");
  }

  const productDoc = await Product.findById(product);
  if (!productDoc) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (variant) {
    const variantDoc = await VariantMaster.findById(variant);
    if (!variantDoc || variantDoc.product.toString() !== product) {
      res.status(400);
      throw new Error("Variant not found or does not belong to this product");
    }
  }

  const currentStock = await getCurrentStock(product, variant);

  if (currentStock < quantity) {
    res.status(400);
    throw new Error(`Insufficient stock. Available: ${currentStock}`);
  }

  const newStock = currentStock - Number(quantity);

  const ledgerEntry = await InventoryLedger.create({
    product,
    variant: variant || null,
    referenceType: "Sale",
    quantity: Number(quantity),
    type: "OUT",
    balanceStock: newStock,
    remarks: remarks || "Stock reduced - Sale",
    createdBy: req.user?._id,
  });

  await updateProductTotalStock(product);

  res.status(201).json({
    success: true,
    message: "Stock reduced successfully",
    data: ledgerEntry,
  });
});

// @desc Get inventory ledger with filters
export const getInventoryLedger = asyncHandler(async (req, res) => {
  // This function remains unchanged...
  const { page = 1, limit = 50, ...filters } = req.query;
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
      .limit(Number(limit)),
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

// @desc Get product variants with current stock
export const getProductVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variants = await VariantMaster.find({
    product: productId,
    isDeleted: false,
    status: "Active",
  })
    .populate("size", "sizeName value")
    .populate("color", "colorName value")
    .sort({ createdAt: -1 });
  const variantsWithStock = await Promise.all(
    variants.map(async (variant) => ({
      ...variant.toObject(),
      currentStock: await getCurrentStock(productId, variant._id),
    }))
  );
  res.json({ success: true, data: variantsWithStock });
});

// @desc Get stock summary
export const getStockSummary = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const objectIdProductId = new mongoose.Types.ObjectId(productId);

  const [totalIn, totalOut] = await Promise.all([
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "IN" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    InventoryLedger.aggregate([
      { $match: { product: objectIdProductId, type: "OUT" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
  ]);

  const product = await Product.findById(productId).select("stock");

  res.json({
    success: true,
    data: {
      totalPurchase: totalIn[0]?.total || 0,
      totalSale: totalOut[0]?.total || 0,
      currentStock: product?.stock || 0,
    },
  });
});

export const getInventoryStats = asyncHandler(async (req, res) => {
  // This function remains unchanged...
});
