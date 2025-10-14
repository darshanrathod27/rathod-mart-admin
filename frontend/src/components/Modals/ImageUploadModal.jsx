import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardActions,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from "@mui/material";
import { Close, CloudUpload, Delete, CheckCircle } from "@mui/icons-material";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";

// **FIX:** Define the base URL to construct full image paths
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ImageUploadModal = ({ open, onClose, product, onUploadSuccess }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchImages = useCallback(async () => {
    if (!product?._id) return;
    setLoading(true);
    setError("");
    try {
      const response = await productService.getProductImages(product._id);
      setImages(response.data);
    } catch (err) {
      setError("Failed to load existing images.");
      toast.error("Failed to load images.");
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open, fetchImages]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      await productService.uploadProductImage(product._id, formData);
      toast.success("Image uploaded!");
      await fetchImages();
      onUploadSuccess(); // **FIX:** This tells the main page to refresh
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (window.confirm("Delete this image permanently?")) {
      try {
        await productService.deleteProductImage(imageId);
        toast.success("Image deleted!");
        await fetchImages();
        onUploadSuccess(); // **FIX:** This tells the main page to refresh
      } catch (err) {
        toast.error("Failed to delete image.");
      }
    }
  };

  const setAsPrimary = async (imageId) => {
    try {
      await productService.updateProductImage(imageId, { isPrimary: true });
      toast.success("Primary image updated!");
      await fetchImages();
      onUploadSuccess(); // **FIX:** This tells the main page to refresh
    } catch (err) {
      toast.error("Failed to update primary image.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Manage Images for: {product?.name}
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Card sx={{ mb: 3, p: 2, bgcolor: "grey.50" }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUpload />}
            disabled={uploading}
            fullWidth
          >
            {uploading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Upload New Image"
            )}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileSelect}
            />
          </Button>
        </Card>
        <Typography variant="h6" gutterBottom>
          Existing Images ({images.length})
        </Typography>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <Grid container spacing={2}>
          {!loading && images.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">No images for this product yet.</Alert>
            </Grid>
          )}
          {images.map((image) => (
            <Grid item xs={12} sm={6} md={4} key={image._id}>
              <Card sx={{ position: "relative" }}>
                {image.isPrimary && (
                  <Chip
                    icon={<CheckCircle />}
                    label="Primary"
                    color="success"
                    size="small"
                    sx={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}
                  />
                )}
                <CardMedia
                  component="img"
                  height="160"
                  image={`${API_BASE_URL}${image.imageUrl}`}
                  alt="Product"
                />
                <CardActions sx={{ justifyContent: "space-between" }}>
                  <Tooltip title="Set as Primary">
                    <span>
                      <IconButton
                        onClick={() => setAsPrimary(image._id)}
                        disabled={image.isPrimary}
                        color="primary"
                        size="small"
                      >
                        <CheckCircle />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete Image">
                    <IconButton
                      onClick={() => handleDelete(image._id)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageUploadModal;
