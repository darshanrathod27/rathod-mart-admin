import express from "express";
const router = express.Router();

// Mock inventory data
const mockInventory = [
  { _id: "1", productId: "1", stock: 50, reserved: 5, available: 45 },
  { _id: "2", productId: "2", stock: 30, reserved: 2, available: 28 },
];

// GET /api/inventory
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockInventory,
      total: mockInventory.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
