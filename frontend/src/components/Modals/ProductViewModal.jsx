// frontend/src/components/Modals/ProductViewModal.jsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Avatar,
  Chip,
  Rating,
  Divider,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import {
  Close,
  Event,
  Update,
  ArrowBackIosNew,
  ArrowForwardIos,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const InfoRow = ({ label, value, children }) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{ py: 1.5 }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {children || (
      <Typography variant="body1" fontWeight={600} align="right">
        {value || "N/A"}
      </Typography>
    )}
  </Stack>
);

const ProductViewModal = ({ open, onClose, product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (product) {
      const primaryIndex = product.images?.findIndex((img) => img.isPrimary);
      setCurrentImageIndex(primaryIndex > -1 ? primaryIndex : 0);
    }
  }, [product]);

  if (!product) return null;

  const images = product.images || [];

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const getStockColor = (stock) =>
    stock === 0 ? "error" : stock <= 10 ? "warning" : "success";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" fontWeight={700} color="primary.dark">
            Product Details
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={4}>
          {/* Image Gallery */}
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                position: "relative",
                overflow: "hidden",
                height: "450px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AnimatePresence initial={false}>
                {images.length > 0 ? (
                  <motion.img
                    key={currentImageIndex}
                    src={`${API_BASE_URL}${images[currentImageIndex]?.imageUrl}`}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 200,
                      height: 200,
                      bgcolor: product.color || "grey.200",
                      fontSize: "6rem",
                    }}
                  >
                    {product.icon || "📦"}
                  </Avatar>
                )}
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <IconButton
                    onClick={prevImage}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 8,
                      transform: "translateY(-50%)",
                      bgcolor: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <ArrowBackIosNew />
                  </IconButton>
                  <IconButton
                    onClick={nextImage}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      right: 8,
                      transform: "translateY(-50%)",
                      bgcolor: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <ArrowForwardIos />
                  </IconButton>
                </>
              )}
            </Paper>
            {/* Thumbnail previews */}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              sx={{ mt: 2 }}
            >
              {images.map((img, index) => (
                <Avatar
                  key={img._id}
                  src={`${API_BASE_URL}${img.imageUrl}`}
                  variant="rounded"
                  onClick={() => setCurrentImageIndex(index)}
                  sx={{
                    width: 60,
                    height: 60,
                    cursor: "pointer",
                    border:
                      index === currentImageIndex
                        ? "3px solid"
                        : "3px solid transparent",
                    borderColor: "primary.main",
                    opacity: index === currentImageIndex ? 1 : 0.6,
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </Stack>
          </Grid>

          {/* Product Details */}
          <Grid item xs={12} md={7}>
            <Chip
              label={product.category?.name || "Uncategorized"}
              sx={{
                bgcolor: `${product.category?.color}20`,
                color: product.category?.color,
                mb: 1,
              }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              {product.name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1, mb: 2 }}
            >
              <Rating value={product.rating || 0} readOnly precision={0.5} />
              <Typography variant="body2">({product.rating || 0}/5)</Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Pricing
                  </Typography>
                  <InfoRow
                    label="Original Price"
                    value={`₹${product.originalPrice?.toLocaleString("en-IN")}`}
                  />
                  <Divider />
                  <InfoRow
                    label="Discount"
                    value={`${product.discount || 0}%`}
                  />
                  <Divider />
                  <InfoRow label="Final Price">
                    <Typography
                      variant="h4"
                      color="primary.main"
                      fontWeight="bold"
                    >
                      ₹{product.price.toLocaleString("en-IN")}
                    </Typography>
                  </InfoRow>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Inventory
                  </Typography>
                  <InfoRow
                    label="Status"
                    children={
                      <Chip
                        label={product.status}
                        color={
                          product.status === "Active" ? "success" : "warning"
                        }
                        size="small"
                      />
                    }
                  />
                  <Divider />
                  <InfoRow
                    label="Stock"
                    children={
                      <Chip
                        label={`${product.stock} available`}
                        color={getStockColor(product.stock)}
                      />
                    }
                  />
                  <Divider />
                  <InfoRow label="SKU / ID" value={product.sku || "N/A"} />
                </Paper>
              </Grid>
            </Grid>

            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mt: 4, color: "text.secondary" }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Event fontSize="small" />
                <Typography variant="caption">
                  Created:{" "}
                  {new Date(product.createdAt).toLocaleDateString("en-IN")}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Update fontSize="small" />
                <Typography variant="caption">
                  Updated:{" "}
                  {new Date(product.updatedAt).toLocaleDateString("en-IN")}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewModal;
