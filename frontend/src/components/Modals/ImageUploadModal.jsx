// src/components/Modals/ImageUploadModal.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  LinearProgress,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CloudUpload,
  Delete,
  Star,
  StarBorder,
  Edit,
  Close,
} from "@mui/icons-material";
import { productService } from "../../services/productService";
import { inventoryService } from "../../services/inventoryService";
import toast from "react-hot-toast";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useDropzone } from "react-dropzone";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Helper: create a cropped Blob from image src and pixelCrop
 * NOTE: sets image.crossOrigin = 'anonymous' to avoid tainting the canvas
 */
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.95
    );
  });
};

const CropDialog = ({ open, src, onCancel, onApply }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);

  const onLoad = useCallback((img) => {
    imgRef.current = img;
    const aspect = 1;
    // start with a centered square crop that fits
    const width = img.width > img.height ? (img.height / img.width) * 100 : 100;
    const height =
      img.height > img.width ? (img.width / img.height) * 100 : 100;
    const x = (100 - width) / 2;
    const y = (100 - height) / 2;

    setCrop({
      unit: "%",
      width: Math.min(width, height) * 0.8,
      height: Math.min(width, height) * 0.8,
      x: x + width * 0.1,
      y: y + height * 0.1,
      aspect,
    });
  }, []);

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error("Please select a crop area");
      return;
    }

    try {
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const blob = await getCroppedImg(imgRef.current.src, pixelCrop);
      onApply(blob);
    } catch (error) {
      console.error("Crop error:", error);
      toast.error("Failed to crop image");
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">Crop Image</Typography>
          <IconButton size="small" onClick={onCancel}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              {/* IMPORTANT: crossOrigin added to avoid canvas tainting issues */}
              <img
                ref={imgRef}
                src={src}
                onLoad={(e) => onLoad(e.currentTarget)}
                style={{ maxWidth: "100%", maxHeight: "60vh" }}
                alt="Crop"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!completedCrop}
        >
          Apply & Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function ImageUploadModal({
  open,
  onClose,
  product,
  onUploadSuccess,
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [pendingSrc, setPendingSrc] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showCrop, setShowCrop] = useState(false);

  const [reCrop, setReCrop] = useState(null);

  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("");

  // Dropzone handlers (single-file flow)
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles?.[0];
    if (!file) return;
    setPendingFile(file);
    const src = URL.createObjectURL(file);
    setPendingSrc(src);
    setShowCrop(true);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const fetchImagesAndVariants = useCallback(async () => {
    if (!product?._id) return;
    setLoading(true);
    try {
      const [imgs, vRes] = await Promise.all([
        productService.getProductImages(product._id),
        inventoryService.getProductVariants(product._id),
      ]);

      setImages(imgs || []);
      // both shapes handled: vRes may be { data: [...] } or [...]
      setVariants(vRes?.data || vRes || []);
    } catch (e) {
      console.error("Fetch data error:", e);
      toast.error("Failed to load images or variants");
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (open) {
      fetchImagesAndVariants();
    }
  }, [open, fetchImagesAndVariants]);

  const applyNewCropAndUpload = async (blob) => {
    setShowCrop(false);
    setUploading(true);
    try {
      const file = new File(
        [blob],
        pendingFile?.name || `img-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        }
      );
      const fd = new FormData();
      fd.append("images", file);
      if (selectedVariant) fd.append("variantId", selectedVariant);

      await productService.uploadMultipleProductImages(product._id, fd);
      toast.success("Image uploaded");
      setPendingSrc(null);
      setPendingFile(null);
      await fetchImagesAndVariants();
      onUploadSuccess?.();
    } catch (e) {
      console.error("Upload error:", e);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      const filename = img.filename || img._id;
      await productService.deleteProductImage(product._id, filename);
      toast.success("Image deleted");
      await fetchImagesAndVariants();
      onUploadSuccess?.();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed");
    }
  };

  const handleSetPrimary = async (img) => {
    try {
      const filename = img.filename || img._id;
      await productService.setPrimaryImage(product._id, filename);
      toast.success("Primary image updated");
      await fetchImagesAndVariants();
      onUploadSuccess?.();
    } catch (err) {
      console.error("Set primary error:", err);
      toast.error("Update failed");
    }
  };

  const openReCrop = (img) => {
    const src =
      img.fullUrl ||
      img.fullImageUrl ||
      img.previewUrl ||
      `${API_BASE_URL}${img.url || img.imageUrl}`;
    setReCrop({ img, src });
  };

  const applyReCrop = async (blob) => {
    // reCrop may be referenced in the outer scope; capture it early
    const localReCrop = reCrop;
    setReCrop(null);
    setUploading(true);
    try {
      const file = new File([blob], `recrop-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const fd = new FormData();
      fd.append("images", file);
      if (selectedVariant) fd.append("variantId", selectedVariant);

      await productService.uploadMultipleProductImages(product._id, fd);

      // delete original image (best-effort)
      try {
        await productService.deleteProductImage(
          product._id,
          localReCrop.img.filename || localReCrop.img._id
        );
      } catch (err) {
        // ignore delete errors
      }

      toast.success("Image updated");
      await fetchImagesAndVariants();
      onUploadSuccess?.();
    } catch (e) {
      console.error("Re-crop error:", e);
      toast.error("Update failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Product Images
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {product?.name}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component="span"
                variant="contained"
                startIcon={<CloudUpload />}
                size="small"
                onClick={openFileDialog}
              >
                Upload
              </Button>
              <IconButton size="small" onClick={onClose}>
                <Close />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{ minHeight: 300, outline: "none" }}
          {...getRootProps()}
        >
          <input {...getInputProps()} />

          {(uploading || loading) && <LinearProgress sx={{ mb: 2 }} />}

          {variants && variants.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Assign new images to (Optional)</InputLabel>
              <Select
                value={selectedVariant}
                label="Assign new images to (Optional)"
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                <MenuItem value="">
                  <em>General Images (No Variant)</em>
                </MenuItem>
                {variants.map((v) => (
                  <MenuItem key={v._id} value={v._id}>
                    {v.color?.colorName ? `${v.color.colorName} ` : ""}
                    {v.size?.sizeName ? ` / ${v.size.sizeName}` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {isDragActive && (
            <Paper
              sx={{
                p: 6,
                border: "2px dashed",
                borderColor: "primary.main",
                textAlign: "center",
                bgcolor: alpha("#E8F5E9", 0.7),
                mb: 2,
              }}
            >
              <Typography variant="h6" color="primary.main">
                Drop the image here...
              </Typography>
            </Paper>
          )}

          {images.length === 0 && !loading && !isDragActive && (
            <Paper
              sx={{
                p: 6,
                border: "2px dashed",
                borderColor: "grey.300",
                textAlign: "center",
                bgcolor: alpha("#f5f5f5", 0.3),
                pointerEvents: "none",
                mb: 2,
              }}
            >
              <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No images yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Upload" or drag & drop an image here
              </Typography>
            </Paper>
          )}

          {images.length > 0 && (
            <Grid container spacing={2}>
              {images.map((img, idx) => {
                const imgSrc =
                  img.fullUrl ||
                  img.fullImageUrl ||
                  img.previewUrl ||
                  `${API_BASE_URL}${img.url || img.imageUrl}`;
                return (
                  <Grid
                    item
                    xs={6}
                    sm={4}
                    md={3}
                    key={img.filename || img._id || img.id || idx}
                  >
                    <Card
                      sx={{
                        position: "relative",
                        border: "1px solid",
                        borderColor: img.isPrimary
                          ? "primary.main"
                          : "grey.300",
                        transition: "all 0.2s",
                        "&:hover": { boxShadow: 3 },
                      }}
                    >
                      {img.isPrimary && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            zIndex: 1,
                            bgcolor: "primary.main",
                            color: "white",
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Primary
                        </Box>
                      )}
                      {img.variant && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            zIndex: 1,
                            bgcolor: "info.main",
                            color: "white",
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Variant
                        </Box>
                      )}
                      <CardMedia
                        component="img"
                        height="140"
                        image={imgSrc}
                        alt=""
                        sx={{ objectFit: "cover" }}
                      />
                      <CardActions
                        sx={{ justifyContent: "space-between", p: 1 }}
                      >
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleSetPrimary(img)}
                            disabled={img.isPrimary || img._localFile}
                          >
                            {img.isPrimary ? (
                              <Star fontSize="small" color="primary" />
                            ) : (
                              <StarBorder fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openReCrop(img)}
                            disabled={img._localFile}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Stack>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(img)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="contained" size="small">
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Crop dialog for new uploads */}
      {showCrop && pendingSrc && (
        <CropDialog
          open={showCrop}
          src={pendingSrc}
          onCancel={() => {
            setShowCrop(false);
            setPendingSrc(null);
            setPendingFile(null);
          }}
          onApply={applyNewCropAndUpload}
        />
      )}

      {/* Crop dialog for recropping existing images */}
      {reCrop && (
        <CropDialog
          open={Boolean(reCrop)}
          src={reCrop.src}
          onCancel={() => setReCrop(null)}
          onApply={applyReCrop}
        />
      )}
    </>
  );
}
