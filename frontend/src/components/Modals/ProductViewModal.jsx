import React from "react";
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
import { Close, Event, Update } from "@mui/icons-material";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const InfoRow = ({ label, value, children }) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{ py: 1, px: 1 }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {children || (
      <Typography variant="body1" fontWeight="500" align="right" noWrap>
        {value || "N/A"}
      </Typography>
    )}
  </Stack>
);

const ProductViewModal = ({ open, onClose, product }) => {
  if (!product) return null;

  const getStockColor = (stock) => {
    if (stock === 0) return "error";
    if (stock <= 10) return "warning";
    return "success";
  };

  const getStockText = (stock) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= 10) return "Low Stock";
    return "In Stock";
  };

  // Correctly find the primary image or fall back to the first image.
  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage
    ? `${API_BASE_URL}${primaryImage.imageUrl}`
    : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
        transition: { duration: 0.3, ease: "easeInOut" },
        sx: { borderRadius: 4, overflow: "hidden" },
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" fontWeight="600">
            Product Details
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <Avatar
              src={imageUrl}
              variant="rounded"
              sx={{
                bgcolor: product.color || "#4CAF50",
                width: 90,
                height: 90,
                fontSize: "3rem",
              }}
            >
              {/* Show icon only if there is no image */}
              {!primaryImage && (product.icon || "📦")}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h3" component="h1" fontWeight="bold" noWrap>
              {product.name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1 }}
            >
              {product.category && (
                <Chip
                  label={product.category.name}
                  size="small"
                  sx={{
                    bgcolor: `${product.category.color}20`,
                    color: product.category.color,
                  }}
                />
              )}
              <Chip
                label={product.status}
                size="small"
                color={product.status === "Active" ? "success" : "warning"}
                variant="outlined"
              />
            </Stack>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 3, height: "100%" }}
            >
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {product.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Rating:
                </Typography>
                <Rating value={product.rating || 0} readOnly />
                <Typography variant="body2">
                  ({product.rating || 0}/5)
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 3, height: "100%" }}
            >
              <Typography variant="h6" gutterBottom>
                Pricing & Stock
              </Typography>
              <InfoRow
                label="Original Price"
                value={`₹${new Intl.NumberFormat("en-IN").format(
                  product.originalPrice || product.price
                )}`}
              />
              <Divider component="div" />
              <InfoRow label="Discount" value={`${product.discount || 0}%`} />
              <Divider component="div" />
              <InfoRow label="Final Price">
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  ₹{new Intl.NumberFormat("en-IN").format(product.price)}
                </Typography>
              </InfoRow>
              <Divider sx={{ my: 1 }} />
              <InfoRow label="Stock Status:">
                <Chip
                  label={getStockText(product.stock)}
                  color={getStockColor(product.stock)}
                  size="small"
                />
              </InfoRow>
              <Divider component="div" />
              <InfoRow label="Quantity Available:" value={product.stock} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Business Details
              </Typography>
              <InfoRow label="Company" value={product.company} />
              <Divider component="div" />
              <InfoRow label="Origin" value={product.place} />
              <Divider component="div" />
            </Paper>
          </Grid>
        </Grid>
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mt: 3, color: "text.secondary" }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Event fontSize="small" />
            <Typography variant="caption">
              Created: {new Date(product.createdAt).toLocaleDateString("en-IN")}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Update fontSize="small" />
            <Typography variant="caption">
              Updated: {new Date(product.updatedAt).toLocaleDateString("en-IN")}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewModal;
