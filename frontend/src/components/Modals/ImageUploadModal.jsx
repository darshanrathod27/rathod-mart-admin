import React, { useState, useRef, useEffect } from "react";
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
  Divider,
} from "@mui/material";
import { Close, CloudUpload, Delete } from "@mui/icons-material";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getCroppedFile(image, crop, fileName) {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }
        blob.name = fileName;
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.95
    );
  });
}

const ImageUploadModal = ({ open, onClose, product, onUploadSuccess }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const imgRef = useRef(null);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchImages = async () => {
    if (!product?._id) return;
    setLoading(true);
    setError("");
    try {
      const response = await productService.getProductImages(product._id);
      setExistingImages(response.data);
    } catch (err) {
      setError("Failed to load existing images.");
      toast.error("Failed to load existing images.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchImages();
      // Reset state every time the modal opens
      setImgSrc("");
      setCrop(undefined);
      setCompletedCrop(null);
      setOriginalFile(null);
    }
  }, [open, product]);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setOriginalFile(file);
      setCrop(undefined); // Reset crop on new image
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(newCrop);
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current || !originalFile) {
      toast.error("Please select and crop an image first.");
      return;
    }
    setLoading(true);
    try {
      const croppedFile = await getCroppedFile(
        imgRef.current,
        completedCrop,
        originalFile.name
      );
      const formData = new FormData();
      formData.append("image", croppedFile);

      await productService.uploadProductImage(product._id, formData);
      toast.success("Image uploaded successfully!");

      setImgSrc("");
      setOriginalFile(null);

      await fetchImages(); // Refresh images list
      onUploadSuccess(); // Refresh main product table
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      setLoading(true);
      try {
        await productService.deleteProductImage(imageId);
        toast.success("Image deleted!");
        await fetchImages(); // Refresh images list
        onUploadSuccess(); // Refresh main product table
      } catch (err) {
        toast.error("Failed to delete image.");
      } finally {
        setLoading(false);
      }
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
        Manage Images for {product?.name}
        <IconButton aria-label="close" onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Add New Image
        </Typography>

        {!imgSrc && (
          <Box
            component="label"
            sx={{
              border: "2px dashed grey",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              mb: 3,
            }}
          >
            <CloudUpload sx={{ fontSize: 60, color: "grey.500" }} />
            <Typography>Click or drag & drop to upload</Typography>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={onSelectFile}
            />
          </Box>
        )}

        {imgSrc && (
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                onLoad={onImageLoad}
                style={{ maxHeight: "40vh" }}
                alt="Crop preview"
              />
            </ReactCrop>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!completedCrop || loading}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save Cropped Image"
              )}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Existing Images
        </Typography>
        {loading && !existingImages.length && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}

        <Grid container spacing={2}>
          {existingImages.length > 0
            ? existingImages.map((image) => (
                <Grid item xs={12} sm={6} md={4} key={image._id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="140"
                      image={`${API_BASE_URL}${image.imageUrl}`}
                      alt="Product Image"
                    />
                    <CardActions sx={{ justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(image._id)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            : !loading && (
                <Grid item xs={12}>
                  <Typography sx={{ p: 2, textAlign: "center" }}>
                    No images found.
                  </Typography>
                </Grid>
              )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageUploadModal;
