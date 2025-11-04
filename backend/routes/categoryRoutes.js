import express from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  restoreCategory,
  getDeletedCategories,
  permanentDeleteCategory,
} from "../controllers/categoryController.js";
// Add any validation middleware you have

const router = express.Router();

router.route("/").get(getCategories).post(createCategory);

router.route("/stats").get(getCategoryStats);
router.route("/deleted").get(getDeletedCategories);

router
  .route("/:id")
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

router.route("/:id/restore").put(restoreCategory);
router.route("/:id/permanent").delete(permanentDeleteCategory);

export default router;
