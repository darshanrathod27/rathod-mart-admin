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

// --- END HELPER FUNCTIONS ---

// @desc Auth user & get token (Login) - FOR CUSTOMER APP
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
    generateToken(res, dbUser._id, "jwt");
    const user = dbUser.toObject();
    delete user.password;
    res.json(user);
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc Auth admin user (Login) - FOR ADMIN APP
// @route POST /api/users/admin-login
// @access Public
export const loginAdminUser = ah(async (req, res) => {
  const { email, password } = req.body;
  let user;
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    user = {
      _id: "SUPER_ADMIN_ID",
      name: "Super Admin",
      email: process.env.ADMIN_EMAIL,
      role: "admin",
      status: "active",
    };
  } else {
    res.status(401);
    throw new Error("Invalid admin email or password");
  }
  if (user) {
    generateToken(res, user._id, "admin_jwt");
    res.json(user);
  }
});

// @desc Register a new user (for customer frontend)
// @route POST /api/users/register
// @access Public
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

// @desc Get user profile (for logged-in user, customer or admin)
// @route GET /api/users/profile (customer)
// @route GET /api/users/admin-profile (admin)
// @access Private (Customer) / Private (Admin)
export const getUserProfile = ah(async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Update user profile (for logged-in customer)
// @route PUT /api/users/profile
// @access Private (Customer)
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
  if (username && username !== user.username) {
    const exists = await User.findOne({
      username,
      _id: { $ne: user._id },
    });
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
    user.address = {
      street: address.street || user.address?.street,
      city: address.city || user.address?.city,
      state: address.state || user.address?.state,
      postalCode: address.postalCode || user.address?.postalCode,
      country: address.country || user.address?.country,
    };
  }
  if (password) {
    user.password = password;
  }
  if (req.file) {
    if (user.profileImage) {
      await removeFileByUrl(user.profileImage);
    }
    const filename = makeFilename(`profile-${user._id}`);
    user.profileImage = await saveBufferAsJpeg(req.file.buffer, filename, 300);
  }
  const updatedUser = await user.save();
  res.json(updatedUser);
});

// --- ADMIN FUNCTIONS ---

// @desc Create user (by Admin)
// @route POST /api/users
// @access Admin
export const createUser = ah(async (req, res) => {
  const {
    name,
    email,
    password,
    phone = "",
    username,
    birthday,
    role = "customer",
    status = "active",
    address,
  } = req.body;
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
  const payload = {
    name,
    email,
    password,
    phone,
    username,
    birthday,
    role,
    status,
    address,
  };
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

// @desc Get all users (by Admin) - ENHANCED SEARCH
// @route GET /api/users
// @access Admin
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

  // ✅ ADVANCED SEARCH: Search by name, email, phone, username
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

// @desc Get user by ID (by Admin)
// @route GET /api/users/:id
// @access Admin
export const getUserById = ah(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const e = new Error("User not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: user });
});

// @desc Update user (by Admin)
// @route PUT /api/users/:id
// @access Admin
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

  if (update.address) {
    const user = await User.findById(id);
    user.address = {
      street:
        update.address.street !== undefined
          ? update.address.street
          : user.address?.street,
      city:
        update.address.city !== undefined
          ? update.address.city
          : user.address?.city,
      state:
        update.address.state !== undefined
          ? update.address.state
          : user.address?.state,
      postalCode:
        update.address.postalCode !== undefined
          ? update.address.postalCode
          : user.address?.postalCode,
      country:
        update.address.country !== undefined
          ? update.address.country
          : user.address?.country,
    };
    await user.save();
    delete update.address;
  }

  if (req.file) {
    const userOld = await User.findById(id);
    if (userOld && userOld.profileImage)
      await removeFileByUrl(userOld.profileImage);
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

// @desc Delete user (by Admin)
// @route DELETE /api/users/:id
// @access Admin
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
