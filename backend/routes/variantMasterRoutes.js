import express from "express";
const router = express.Router();

// Mock variant data
const mockVariants = [
  { _id: "1", name: "Red-Large", color: "Red", size: "Large", sku: "VAR001" },
  {
    _id: "2",
    name: "Blue-Medium",
    color: "Blue",
    size: "Medium",
    sku: "VAR002",
  },
];

// GET /api/variant-master
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockVariants,
      total: mockVariants.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
