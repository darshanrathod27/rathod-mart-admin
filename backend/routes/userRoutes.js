import express from "express";
const router = express.Router();

// Mock users
const mockUsers = [
  { _id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
  { _id: "2", name: "John Doe", email: "john@example.com", role: "user" },
];

// GET /api/users
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockUsers,
      total: mockUsers.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
