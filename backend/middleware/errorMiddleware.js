export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  res.status(status).json({
    success: false,
    message: err.message || "Server Error",
    stack: isProd ? undefined : err.stack,
  });
};
