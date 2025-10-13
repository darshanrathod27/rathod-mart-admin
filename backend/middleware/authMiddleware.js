// Temporary placeholder auth middleware
export const protect = (req, res, next) => {
  // For now, just pass through without authentication
  // Add your JWT verification logic here later
  req.user = { _id: null }; // Placeholder user
  next();
};
