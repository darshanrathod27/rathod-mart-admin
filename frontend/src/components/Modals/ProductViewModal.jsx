// frontend/src/components/Modals/ProductViewModal.jsx
import React, { useState } from "react";
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
  TableHead,
  TableRow,
  Paper,
  Badge,
} from "@mui/material";
import {
  Close,
  Edit,
  Inventory,
  LocalOffer,
  Star,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProductViewModal = ({ open, onClose, product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  if (!product) return null;

  const images = product.images || [];
  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  const currentImage = images[currentImageIndex] || primaryImage;

  const getImageUrl = (image) => {
    if (!image) return null;
    return image.fullImageUrl || `${API_BASE_URL}${image.imageUrl}`;
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: "80vh" },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SKU: {product.sku || "N/A"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Image Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ position: "relative" }}>
              {images.length > 0 ? (
                <>
                  <CardMedia
                    component="img"
                    height="400"
                    image={getImageUrl(currentImage)}
                    alt={product.name}
                    sx={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = "/placeholder-image.png";
                    }}
                  />

                  {images.length > 1 && (
                    <>
                      <IconButton
                        sx={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "white",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        }}
                        onClick={handlePrevImage}
                      >
                        <ChevronLeft />
                      </IconButton>

                      <IconButton
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "white",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        }}
                        onClick={handleNextImage}
                      >
                        <ChevronRight />
                      </IconButton>

                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "white",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption">
                          {currentImageIndex + 1} / {images.length}
                        </Typography>
                      </Box>
                    </>
                  )}
                </>
              ) : (
                <Box
                  height={400}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="grey.100"
                >
                  <Typography variant="h6" color="text.secondary">
                    No Image Available
                  </Typography>
                </Box>
              )}
            </Card>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {images.map((image, index) => (
                  <Avatar
                    key={image._id}
                    src={getImageUrl(image)}
                    variant="rounded"
                    sx={{
                      width: 60,
                      height: 60,
                      cursor: "pointer",
                      border:
                        index === currentImageIndex
                          ? "2px solid #1976d2"
                          : "2px solid transparent",
                      "&:hover": { border: "2px solid #1976d2" },
                    }}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    {!getImageUrl(image) && product.icon}
                  </Avatar>
                ))}
              </Box>
            )}
          </Grid>

          {/* Product Details */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Basic Info */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h4"
                  color="success.main"
                  fontWeight="bold"
                  gutterBottom
                >
                  ₹{product.price?.toLocaleString("en-IN") || "0"}
                </Typography>

                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                  <Rating value={product.rating || 0} readOnly />
                  <Typography variant="body2" color="text.secondary">
                    ({product.reviewCount || 0} reviews)
                  </Typography>
                </Box>

                <Box display="flex" gap={1} sx={{ mb: 2 }}>
                  <Chip
                    label={product.status}
                    color={product.status === "Active" ? "success" : "warning"}
                    variant="filled"
                  />
                  <Chip
                    label={`Stock: ${product.stock || 0}`}
                    color={
                      (product.stock || 0) > 10
                        ? "success"
                        : (product.stock || 0) > 0
                        ? "warning"
                        : "error"
                    }
                    variant="outlined"
                  />
                  {product.featured && (
                    <Chip
                      label="Featured"
                      color="primary"
                      icon={<Star />}
                      variant="filled"
                    />
                  )}
                </Box>

                <Typography variant="body1" paragraph>
                  {product.description || "No description available."}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Detailed Information Tabs */}
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Details" />
                <Tab label="Specifications" />
                <Tab label="Images" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell fontWeight="bold">Category</TableCell>
                        <TableCell>{product.category?.name || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Brand</TableCell>
                        <TableCell>{product.brand || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">SKU</TableCell>
                        <TableCell>{product.sku || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Barcode</TableCell>
                        <TableCell>{product.barcode || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Min Stock Level</TableCell>
                        <TableCell>{product.minStock || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Weight</TableCell>
                        <TableCell>{product.weight || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Dimensions</TableCell>
                        <TableCell>{product.dimensions || "N/A"}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell fontWeight="bold">Material</TableCell>
                        <TableCell>{product.material || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Color</TableCell>
                        <TableCell>{product.color || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Size</TableCell>
                        <TableCell>{product.size || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell fontWeight="bold">Warranty</TableCell>
                        <TableCell>{product.warranty || "N/A"}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Product Images ({images.length})
                  </Typography>
                  {images.length > 0 ? (
                    <Grid container spacing={2}>
                      {images.map((image, index) => (
                        <Grid item xs={4} key={image._id}>
                          <Card>
                            <CardMedia
                              component="img"
                              height="120"
                              image={getImageUrl(image)}
                              alt={`Image ${index + 1}`}
                              sx={{ objectFit: "cover" }}
                            />
                            <Box sx={{ p: 1, textAlign: "center" }}>
                              {image.isPrimary && (
                                <Chip
                                  label="Primary"
                                  color="primary"
                                  size="small"
                                />
                              )}
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">
                      No images available
                    </Typography>
                  )}
                </Box>
              </TabPanel>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" startIcon={<Edit />} color="primary">
          Edit Product
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductViewModal;
