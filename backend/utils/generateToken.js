// backend/utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (res, userId, cookieName = "jwt") => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set JWT as an HTTP-Only cookie
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "production", // Use secure cookies in production
    sameSite: "strict", // Prevent CSRF
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export default generateToken;
