// backend/controllers/userController.js

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import generateToken from "../utils/generateToken.js";

const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile");

// --- HELPER FUNCTIONS ---
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const makeFilename = (prefix = "profile") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

async function saveBufferAsJpeg(buffer, filename, size = 300) {
  const out = path.join(UPLOAD_DIR, filename);
  await sharp(buffer)
    .rotate()
    .resize(size, size, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toFile(out);
  return `/uploads/profile/${filename}`;
}

async function removeFileByUrl(urlPath) {
  if (!urlPath) return;
  try {
    const p = path.join(process.cwd(), urlPath.replace(/^\//, ""));
    if (fs.existsSync(p)) await fs.promises.unlink(p);
  } catch (err) {
    console.warn("Failed to delete file", urlPath, err.message);
  }
}

const SORT_ALLOW = new Set([
  "name",
  "email",
  "role",
  "status",
  "createdAt",
  "updatedAt",
]);

// --- AUTH CONTROLLERS ---

// @desc Auth admin/staff user (Login) - FOR ADMIN APP
// @route POST /api/users/admin-login
// @access Public
export const loginAdminUser = ah(async (req, res) => {
  const { email, password } = req.body;

  // 1. Check for Super Admin (from .env)
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    generateToken(res, "SUPER_ADMIN_ID", "admin_jwt");
    return res.json({
      _id: "SUPER_ADMIN_ID",
      name: "Super Admin",
      email: process.env.ADMIN_EMAIL,
      role: "admin",
      status: "active",
    });
  }

  // 2. If not Super Admin, Check Database
  const user = await User.findOne({ email }).select("+password");

  if (user && (await bcrypt.compare(password, user.password))) {
    // 3. Check if user has allowed role (Admin, Manager, or Staff)
    const allowedRoles = ["admin", "manager", "staff"];

    if (allowedRoles.includes(user.role)) {
      // 4. Check if account is active
      if (user.status !== "active") {
        res.status(401);
        throw new Error(
          "Account is inactive or blocked. Contact administrator."
        );
      }

      // 5. Generate Token (Valid for 30 Days via generateToken utility)
      generateToken(res, user._id, "admin_jwt");

      const userObj = user.toObject();
      delete userObj.password; // Do not send password back
      return res.json(userObj);
    } else {
      res.status(401);
      throw new Error(
        "Not authorized. Only Admin, Manager, or Staff can access this panel."
      );
    }
  }

  res.status(401);
  throw new Error("Invalid email or password");
});

// @desc Auth customer user (Login) - FOR CUSTOMER APP
// @route POST /api/users/login
// @access Public
export const loginUser = ah(async (req, res) => {
  const { email, password } = req.body;
  const dbUser = await User.findOne({ email }).select("+password");

  if (dbUser && (await bcrypt.compare(password, dbUser.password))) {
    if (dbUser.status !== "active") {
      res.status(401);
      throw new Error(
        "Account is inactive or blocked. Please contact support."
      );
    }
    // Use 'jwt' cookie for customers
    generateToken(res, dbUser._id, "jwt");
    const user = dbUser.toObject();
    delete user.password;
    res.json(user);
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc Logout admin / clear cookie
// @route POST /api/users/admin-logout
// @access Public
export const logoutAdmin = ah(async (req, res) => {
  res.cookie("admin_jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Admin logged out" });
});

// @desc Logout customer / clear cookie
// @route POST /api/users/logout
// @access Public
export const logoutUser = ah(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Customer logged out" });
});

// --- CRUD & PROFILE CONTROLLERS (Existing code kept same) ---

// @desc Register a new user (customer)
export const registerUser = ah(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  const user = await User.create({
    name,
    email,
    password,
    role: "customer",
    status: "active",
  });
  if (user) {
    generateToken(res, user._id, "jwt");
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc Get user profile
export const getUserProfile = ah(async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Update user profile
export const updateUserProfile = ah(async (req, res) => {
  if (req.user._id === "SUPER_ADMIN_ID") {
    res.status(403);
    throw new Error("Super Admin profile cannot be modified from the app.");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const { name, username, phone, birthday, password, address } = req.body;

  // Update logic
  if (username && username !== user.username) {
    const exists = await User.findOne({ username, _id: { $ne: user._id } });
    if (exists) {
      res.status(409);
      throw new Error("Username is already taken");
    }
    user.username = username;
  }
  user.name = name || user.name;
  user.phone = phone !== undefined ? phone : user.phone;
  user.birthday = birthday || user.birthday;
  if (address) {
    user.address = { ...user.address, ...address };
  }
  if (password) user.password = password;

  if (req.file) {
    if (user.profileImage) await removeFileByUrl(user.profileImage);
    const filename = makeFilename(`profile-${user._id}`);
    user.profileImage = await saveBufferAsJpeg(req.file.buffer, filename, 300);
  }

  const updatedUser = await user.save();
  res.json(updatedUser);
});

// @desc Create user (Admin)
export const createUser = ah(async (req, res) => {
  const { email, username, password, ...rest } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    const e = new Error("Email already in use");
    e.statusCode = 409;
    throw e;
  }
  if (username) {
    const uExists = await User.findOne({ username });
    if (uExists) {
      const e = new Error("Username already in use");
      e.statusCode = 409;
      throw e;
    }
  }
  const payload = { email, username, password, ...rest };
  if (req.file) {
    const filename = makeFilename("profile");
    payload.profileImage = await saveBufferAsJpeg(
      req.file.buffer,
      filename,
      300
    );
  }
  const user = await User.create(payload);
  res.status(201).json({ success: true, data: user });
});

// @desc Get all users
export const getUsers = ah(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    role,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
    dateFrom,
    dateTo,
  } = req.query;
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const filter = {};

  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { username: searchRegex },
    ];
  }
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const sortKey = SORT_ALLOW.has(sortBy) ? sortBy : "createdAt";
  const sortDir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ [sortKey]: sortDir })
      .skip((p - 1) * l)
      .limit(l),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

// @desc Get user by ID
export const getUserById = ah(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const e = new Error("User not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: user });
});

// @desc Update user (Admin)
export const updateUser = ah(async (req, res) => {
  const { id } = req.params;
  const update = { ...req.body };

  if (update.email) {
    const exists = await User.findOne({
      email: update.email,
      _id: { $ne: id },
    });
    if (exists) {
      const e = new Error("Email already in use");
      e.statusCode = 409;
      throw e;
    }
  }
  if (update.username) {
    const exists = await User.findOne({
      username: update.username,
      _id: { $ne: id },
    });
    if (exists) {
      const e = new Error("Username already in use");
      e.statusCode = 409;
      throw e;
    }
  }
  if (update.password) {
    const salt = await bcrypt.genSalt(12);
    update.password = await bcrypt.hash(update.password, salt);
  } else {
    delete update.password;
  }
  if (req.file) {
    const userOld = await User.findById(id);
    if (userOld?.profileImage) await removeFileByUrl(userOld.profileImage);
    const filename = makeFilename("profile");
    update.profileImage = await saveBufferAsJpeg(
      req.file.buffer,
      filename,
      300
    );
  }

  const user = await User.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    const e = new Error("User not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: user });
});

// @desc Delete user
export const deleteUser = ah(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    const e = new Error("User not found");
    e.statusCode = 404;
    throw e;
  }
  if (user.profileImage) await removeFileByUrl(user.profileImage);
  res.json({ success: true, message: "User deleted" });
});
