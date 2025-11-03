import express from "express";
const router = express.Router();

// Mock categories
const mockCategories = [
  {
    _id: "1",
    name: "Electronics",
    slug: "electronics",
    description: "Electronic items",
  },
  {
    _id: "2",
    name: "Clothing",
    slug: "clothing",
    description: "Fashion and clothing",
  },
  {
    _id: "3",
    name: "Books",
    slug: "books",
    description: "Books and literature",
  },
  {
    _id: "4",
    name: "Home & Garden",
    slug: "home-garden",
    description: "Home and garden items",
  },
];

// GET /api/categories
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockCategories,
      total: mockCategories.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/categories/:id
router.get("/:id", (req, res) => {
  try {
    const category = mockCategories.find((c) => c._id === req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/categories
router.post("/", (req, res) => {
  try {
    const newCategory = {
      _id: String(Date.now()),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCategories.push(newCategory);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
