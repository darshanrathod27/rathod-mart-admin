// src/components/Modals/ProductViewModal.jsx
import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Rating,
  Card,
  CardMedia,
  IconButton,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Badge,
  Stack,
} from "@mui/material";
import {
  Close,
  Edit,
  Inventory,
  Star,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProductViewModal = ({
  open,
  onClose,
  product,
  onEdit,
  onManageStock,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  if (!product) return null;

  const images = product.images || [];
  const primaryImageIndex = images.findIndex((i) => i.isPrimary) ?? 0;
  const effectiveIndex = Math.min(
    currentImageIndex,
    Math.max(primaryImageIndex, 0)
  );

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.fullImageUrl) return image.fullImageUrl;
    if (image.fullUrl) return image.fullUrl;
    if (image.imageUrl)
      return image.imageUrl.startsWith("http")
        ? image.imageUrl
        : `${API_BASE_URL}${image.imageUrl}`;
    if (image.url)
      return image.url.startsWith("http")
        ? image.url
        : `${API_BASE_URL}${image.url}`;
    return null;
  };

  const currentImage = images[effectiveIndex] || null;
  const totalImages = images.length;

  const handleNext = () =>
    setCurrentImageIndex((p) => (p + 1) % Math.max(totalImages, 1));
  const handlePrev = () =>
    setCurrentImageIndex(
      (p) => (p - 1 + Math.max(totalImages, 1)) % Math.max(totalImages, 1)
    );

  const specs = useMemo(
    () => [
      { k: "Category", v: product.category?.name || "N/A" },
      { k: "Brand", v: product.brand || "N/A" },
      { k: "SKU", v: product.sku || "N/A" },
      { k: "Barcode", v: product.barcode || "N/A" },
      { k: "Weight", v: product.weight || "N/A" },
      { k: "Dimensions", v: product.dimensions || "N/A" },
      { k: "Min Stock Level", v: product.minStock || 0 },
      { k: "Total Stock", v: product.totalStock || 0 },
    ],
    [product]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: "80vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="700">
            {product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            SKU: {product.sku || "N/A"}
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Button
            startIcon={<Inventory />}
            onClick={() => onManageStock?.(product)}
          >
            Variants
          </Button>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                position: "relative",
                height: { xs: 340, md: 420 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {currentImage ? (
                <CardMedia
                  component="img"
                  image={getImageUrl(currentImage)}
                  alt={product.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#fafafa",
                  }}
                  onError={(e) => (e.target.src = "/placeholder-image.png")}
                />
              ) : (
                <Box
                  height={320}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="grey.100"
                >
                  <Typography color="text.secondary">
                    No Image Available
                  </Typography>
                </Box>
              )}

              {totalImages > 1 && (
                <>
                  <IconButton
                    onClick={handlePrev}
                    sx={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      bgcolor: "rgba(0,0,0,0.45)",
                      color: "white",
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    onClick={handleNext}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      bgcolor: "rgba(0,0,0,0.45)",
                      color: "white",
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                  <Box sx={{ position: "absolute", bottom: 10, left: 12 }}>
                    <Chip
                      label={`${
                        (currentImageIndex % totalImages) + 1
                      } / ${totalImages}`}
                      size="small"
                    />
                  </Box>
                </>
              )}
            </Card>

            {totalImages > 0 && (
              <Box
                mt={2}
                sx={{ display: "flex", gap: 1, overflowX: "auto", py: 1 }}
              >
                {images.map((img, idx) => (
                  <Avatar
                    key={img.filename || img._id || idx}
                    src={getImageUrl(img)}
                    variant="rounded"
                    sx={{
                      width: 70,
                      height: 70,
                      cursor: "pointer",
                      border:
                        idx === currentImageIndex
                          ? "2px solid"
                          : "1px solid #ddd",
                      borderColor:
                        idx === currentImageIndex
                          ? "primary.main"
                          : "transparent",
                    }}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h5" color="primary" fontWeight={700}>
                  ₹{(product.basePrice || 0).toLocaleString("en-IN")}
                </Typography>
                {product.discountPrice ? (
                  <Chip
                    label={`Offer ₹${product.discountPrice}`}
                    color="secondary"
                  />
                ) : null}
              </Stack>

              <Box mt={1} display="flex" gap={2} alignItems="center">
                <Rating value={product.rating || 0} readOnly />
                <Typography variant="body2" color="text.secondary">
                  ({product.reviewCount || 0} reviews)
                </Typography>
                <Chip
                  label={product.status || "N/A"}
                  size="small"
                  color={product.status === "active" ? "success" : "warning"}
                />
              </Box>

              <Box mt={2}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {product.description || "No description."}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              aria-label="product tabs"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Details" />
              <Tab label="Specifications" />
              <Tab label="Images" />
            </Tabs>

            {tabValue === 0 && (
              <Box mt={2}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {specs.map((s) => (
                        <TableRow key={s.k}>
                          <TableCell sx={{ fontWeight: 700, width: 170 }}>
                            {s.k}
                          </TableCell>
                          <TableCell>{String(s.v)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tabValue === 1 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Features & Tags
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {(product.features || []).map((f, i) => (
                    <Chip key={i} label={f} size="small" />
                  ))}
                </Box>
                <Typography variant="subtitle2">Tags</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                  {(product.tags || []).map((t, i) => (
                    <Chip key={i} label={t} variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {tabValue === 2 && (
              <Box mt={2}>
                <Typography variant="subtitle2">All Images</Typography>
                <Grid container spacing={1} mt={1}>
                  {images.map((img, i) => (
                    <Grid
                      item
                      xs={6}
                      sm={4}
                      md={4}
                      key={img.filename || img._id || i}
                    >
                      <Card>
                        <CardMedia
                          component="img"
                          height="120"
                          image={getImageUrl(img)}
                          alt={img.alt || `img-${i}`}
                          sx={{ objectFit: "cover" }}
                        />
                        <Box
                          sx={{
                            p: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {img.isPrimary && (
                            <Chip
                              label="Primary"
                              size="small"
                              color="primary"
                            />
                          )}
                          <Typography variant="caption">
                            {img.filename || ""}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onEdit?.(product)} startIcon={<Edit />}>
          Edit
        </Button>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductViewModal;
