// backend/routes/inventoryRoutes.js
import express from "express";
import {
  addStock,
  reduceStock,
  getInventoryLedger,
  getProductVariants,
  getStockSummary,
  // getInventoryStats // implement if needed
} from "../controllers/inventoryController.js";

const router = express.Router();

router.post("/add-stock", addStock);
router.post("/reduce-stock", reduceStock);
router.get("/ledger", getInventoryLedger);
router.get("/product-variants/:productId", getProductVariants);
router.get("/stock-summary/:productId", getStockSummary);

export default router;
