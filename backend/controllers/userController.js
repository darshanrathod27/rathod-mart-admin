// backend/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile");

// ensure dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const makeFilename = (prefix = "profile") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

// helper to save buffer using sharp (resize)
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
    // silent
    console.warn("Failed to delete file", urlPath, err.message);
  }
}

// allowlist sort
const SORT_ALLOW = new Set([
  "name",
  "email",
  "role",
  "status",
  "createdAt",
  "updatedAt",
]);

export const createUser = ah(async (req, res) => {
  const {
    name,
    email,
    password,
    phone = "",
    role = "customer",
    status = "active",
  } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    const e = new Error("Email already in use");
    e.statusCode = 409;
    throw e;
  }

  const payload = { name, email, password, phone, role, status };

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

export const getUsers = ah(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    q = "",
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
  if (q) {
    filter.$or = [
      { $text: { $search: q } },
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
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

export const getUserById = ah(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const e = new Error("User not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ success: true, data: user });
});

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

  if (update.password) {
    const salt = await bcrypt.genSalt(12);
    update.password = await bcrypt.hash(update.password, salt);
  }

  // handle new image
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
