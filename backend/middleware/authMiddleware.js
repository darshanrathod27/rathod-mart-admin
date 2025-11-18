// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import User from "../models/User.js";

// Protect routes - FOR CUSTOMERS
// This middleware ONLY looks for the 'jwt' cookie.
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.jwt; // Only checks for 'jwt'

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }

      req.tokenType = "customer";
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Protect routes - FOR ADMINS
// This middleware ONLY looks for the 'admin_jwt' cookie and handles the Super Admin.
const protectAdmin = asyncHandler(async (req, res, next) => {
  let token = req.cookies.admin_jwt; // Only checks for 'admin_jwt'

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check for Super Admin ID
      if (decoded.userId === "SUPER_ADMIN_ID") {
        req.user = {
          _id: "SUPER_ADMIN_ID",
          name: "Super Admin",
          email: process.env.ADMIN_EMAIL,
          role: "admin",
          status: "active",
        };
        req.tokenType = "admin";
        next(); // Skip database lookup
      } else {
        // This is a regular database admin/manager
        req.user = await User.findById(decoded.userId).select("-password");

        if (!req.user) {
          res.status(401);
          throw new Error("User not found");
        }

        req.tokenType = "admin";
        next();
      }
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, admin token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no admin token");
  }
});

// Admin middleware (checks if user is admin or manager)
// This now correctly runs AFTER protectAdmin
const admin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "manager") &&
    req.tokenType === "admin" // Must be logged in via admin panel
  ) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin or manager");
  }
};

export { protect, protectAdmin, admin };
