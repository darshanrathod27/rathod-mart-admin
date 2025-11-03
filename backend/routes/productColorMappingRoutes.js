import express from "express";
const router = express.Router();

// Mock color mapping data
const mockColorMappings = [
  { _id: "1", productId: "1", color: "Red", colorCode: "#FF0000", images: [] },
  { _id: "2", productId: "2", color: "Blue", colorCode: "#0000FF", images: [] },
];

// GET /api/product-color-mapping
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockColorMappings,
      total: mockColorMappings.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
