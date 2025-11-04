import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/userController.js";
// Add any validation middleware you have
// import { validateUser } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.route("/").get(getUsers).post(createUser); // Add validateUser here if you have it

router.route("/stats").get(getUserStats);

router
  .route("/:id")
  .get(getUser)
  .put(updateUser) // Add validateUser here if you have it
  .delete(deleteUser);

export default router;
