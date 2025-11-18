// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// --- NEW Address Sub-Schema ---
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true }, // Full Name
    username: {
      type: String,
      trim: true,
      sparse: true, // Allows nulls, but if set, must be unique
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: "" },
    birthday: { type: Date, default: null },
    address: addressSchema, // --- ADDED ADDRESS ---
    role: {
      type: String,
      enum: ["admin", "manager", "staff", "customer"],
      default: "customer",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, default: "" }, // e.g. /uploads/profile/xxx.jpg
  },
  { timestamps: true }
);

// search
userSchema.index({
  name: "text",
  email: "text",
  phone: "text",
  username: "text",
});

// hide sensitive
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// hash on save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", userSchema);
