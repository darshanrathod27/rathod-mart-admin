import express from "express";
const router = express.Router();

// Mock data for testing
const mockProducts = [
  {
    _id: "1",
    name: "Sample Product 1",
    description: "This is a sample product",
    basePrice: 1000,
    category: { _id: "1", name: "Category 1" },
    status: "active",
    images: [],
    variants: [],
  },
  {
    _id: "2",
    name: "Sample Product 2",
    description: "This is another sample product",
    basePrice: 2000,
    category: { _id: "2", name: "Category 2" },
    status: "active",
    images: [],
    variants: [],
  },
];

// GET /api/products - Get all products
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockProducts,
      pagination: {
        current: 1,
        pages: 1,
        total: mockProducts.length,
        limit: 10,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/products/:id - Get single product
router.get("/:id", (req, res) => {
  try {
    const product = mockProducts.find((p) => p._id === req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/products - Create new product
router.post("/", (req, res) => {
  try {
    const newProduct = {
      _id: String(Date.now()),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProducts.push(newProduct);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
