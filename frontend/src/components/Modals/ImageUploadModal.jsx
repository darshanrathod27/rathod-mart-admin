// frontend/src/components/Modals/ImageUploadModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  Star,
  StarBorder,
  Add,
  Close,
} from "@mui/icons-material";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ImageUploadModal = ({ open, onClose, product, onUploadSuccess }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchImages = useCallback(async () => {
    if (!product?._id) return;

    setLoading(true);
    try {
      const response = await productService.getProductImages(product._id);
      const imagesWithUrls = response.data.map((img) => ({
        ...img,
        fullImageUrl: img.fullImageUrl || `${API_BASE_URL}${img.imageUrl}`,
      }));
      setImages(imagesWithUrls);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      toast.error("Failed to load product images");
    } finally {
      setLoading(false);
    }
  }, [product?._id]);

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open, fetchImages]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files?.length) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      if (files.length === 1) {
        formData.append("image", files[0]);
        const response = await productService.uploadProductImage(
          product._id,
          formData
        );
        toast.success("Image uploaded successfully!");
      } else {
        files.forEach((file) => {
          formData.append("images", file);
        });
        const response = await productService.uploadMultipleProductImages(
          product._id,
          formData
        );
        toast.success(`${files.length} images uploaded successfully!`);
      }

      await fetchImages();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.response?.data?.message || "Failed to upload images");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await productService.deleteProductImage(imageId);
      toast.success("Image deleted successfully!");
      await fetchImages();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await productService.updateProductImage(imageId, { isPrimary: true });
      toast.success("Primary image updated!");
      await fetchImages();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update primary image");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: "70vh" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Manage Product Images</Typography>
            <Typography variant="body2" color="text.secondary">
              {product?.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <LinearProgress sx={{ width: "100%" }} />
          </Box>
        ) : (
          <>
            {/* Upload Area */}
            <Card
              sx={{
                p: 3,
                mb: 3,
                border: "2px dashed #ccc",
                backgroundColor: "grey.50",
                cursor: "pointer",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "primary.light",
                  color: "white",
                },
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() =>
                document.getElementById("image-upload-input").click()
              }
            >
              <Box textAlign="center">
                <CloudUpload sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Upload Product Images
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to select files or drag and drop images here
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Supported formats: JPG, PNG, WebP (Max 5MB each)
                </Typography>
              </Box>
              <input
                id="image-upload-input"
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </Card>

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="indeterminate" />
                <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                  Uploading images...
                </Typography>
              </Box>
            )}

            {/* Current Images */}
            {images.length > 0 ? (
              <Grid container spacing={2}>
                {images.map((image) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={image._id}>
                    <Card sx={{ position: "relative", height: "100%" }}>
                      {image.isPrimary && (
                        <Chip
                          label="Primary"
                          color="primary"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 1,
                          }}
                        />
                      )}

                      <CardMedia
                        component="img"
                        height="200"
                        image={image.fullImageUrl}
                        alt={image.altText || `Product image`}
                        sx={{
                          objectFit: "cover",
                          cursor: "pointer",
                          "&:hover": {
                            opacity: 0.8,
                          },
                        }}
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />

                      <CardActions
                        sx={{ justifyContent: "space-between", p: 1 }}
                      >
                        <Tooltip
                          title={
                            image.isPrimary ? "Primary image" : "Set as primary"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleSetPrimary(image._id)}
                            disabled={image.isPrimary}
                            color={image.isPrimary ? "primary" : "default"}
                          >
                            {image.isPrimary ? <Star /> : <StarBorder />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete image">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteImage(image._id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </CardActions>

                      {/* Image Info */}
                      <Box sx={{ px: 1, pb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {image.originalName || image.fileName}
                        </Typography>
                        {image.size && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Size: {(image.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No images uploaded yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload some images to get started
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => document.getElementById("image-upload-input").click()}
          disabled={uploading}
        >
          Add More Images
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageUploadModal;
