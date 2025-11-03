import express from "express";
const router = express.Router();

// Mock size mapping data
const mockSizeMappings = [
  {
    _id: "1",
    productId: "1",
    size: "Large",
    measurements: { chest: '42"', waist: '36"' },
  },
  {
    _id: "2",
    productId: "2",
    size: "Medium",
    measurements: { chest: '40"', waist: '34"' },
  },
];

// GET /api/product-size-mapping
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockSizeMappings,
      total: mockSizeMappings.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
