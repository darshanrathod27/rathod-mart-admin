// src/components/ImageUpload/ImageUploadManager.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Paper,
  Chip,
  Stack,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  alpha,
} from "@mui/material";
import {
  Delete,
  Edit,
  CloudUpload,
  Star,
  StarBorder,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { v4 as uuidv4 } from "uuid";

/* ---------- helpers ---------- */
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
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

/* ---------- Crop dialog component ---------- */
const CropDialog = ({ open, src, onCancel, onApply }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);

  const onLoad = useCallback((img) => {
    imgRef.current = img;
    const aspect = 1;
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
      onCancel();
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
      onCancel();
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          Crop Image
        </Typography>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img
                ref={imgRef}
                src={src}
                onLoad={(e) => onLoad(e.currentTarget)}
                style={{ maxWidth: "100%", maxHeight: "60vh" }}
                alt="Crop preview"
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
          Apply Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------- utility: compare images arrays (shallow by id/url/filename) ---------- */
function sameImagesArray(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const A = a[i];
    const B = b[i];
    // compare by id, filename or url and whether file exists
    if (A.id && B.id && A.id === B.id) continue;
    const aKey = A.filename || A.url || (A.file && A.file.name) || "";
    const bKey = B.filename || B.url || (B.file && B.file.name) || "";
    if (aKey !== bKey) return false;
  }
  return true;
}

/* ---------- main component ---------- */
const ImageUploadManager = ({
  images = [],
  onImagesChange = () => {},
  maxImages = 15,
  noWrapper = false,
}) => {
  const [localImages, setLocalImages] = useState([]);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const incomingRef = useRef(images);

  // Initialize localImages once from props on first render (or when incoming list truly changes)
  useEffect(() => {
    // Normalize incoming into local shape
    const normalized = (images || []).map((img) => {
      if (img.file) {
        return {
          id: img.id || uuidv4(),
          file: img.file,
          preview: img.preview || URL.createObjectURL(img.file),
          isPrimary: !!img.isPrimary,
        };
      }
      if (img.url || img.fullImageUrl || img.fullUrl) {
        return {
          id: img.id || img.filename || uuidv4(),
          filename: img.filename,
          url: img.url || img.fullImageUrl || img.fullUrl,
          isPrimary: !!img.isPrimary,
        };
      }
      return { id: uuidv4(), preview: "", isPrimary: false };
    });

    // Only update localImages if different by content (avoid loop)
    if (!sameImagesArray(normalized, localImages)) {
      setLocalImages(normalized);
      incomingRef.current = images;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  // Notify parent when localImages change — but only if resulting normalized output is different
  useEffect(() => {
    const out = localImages.map((it) =>
      it.file
        ? {
            id: it.id,
            file: it.file,
            preview: it.preview,
            isPrimary: !!it.isPrimary,
          }
        : {
            id: it.id,
            filename: it.filename,
            url: it.url,
            isPrimary: !!it.isPrimary,
          }
    );

    // Compare with last incoming prop — if same, skip to avoid loop
    if (sameImagesArray(out, images)) {
      // no change from parent perspective
      return;
    }

    // Otherwise notify parent
    onImagesChange(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localImages]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles?.length) return;
      if (localImages.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }
      const file = acceptedFiles[0];
      setPendingFile(file);
      const src = URL.createObjectURL(file);
      setCropSrc(src);
      setEditingIndex(null);
      setCropOpen(true);
    },
    [localImages.length, maxImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: localImages.length >= maxImages,
  });

  const applyCrop = async (blob) => {
    const file = new File(
      [blob],
      pendingFile?.name || `img-${Date.now()}.jpg`,
      { type: "image/jpeg" }
    );
    const preview = URL.createObjectURL(file);

    if (editingIndex !== null && editingIndex >= 0) {
      setLocalImages((s) =>
        s.map((it, i) =>
          i === editingIndex ? { ...it, file, preview, url: undefined } : it
        )
      );
    } else {
      setLocalImages((s) => [
        ...s,
        { id: uuidv4(), file, preview, isPrimary: s.length === 0 },
      ]);
    }

    setCropOpen(false);
    setCropSrc(null);
    setEditingIndex(null);
    setPendingFile(null);
  };

  const recrop = (img, idx) => {
    const src = img.preview || img.url;
    setCropSrc(src);
    setEditingIndex(idx);
    setPendingFile(null);
    setCropOpen(true);
  };

  const removeImage = (id) =>
    setLocalImages((s) => {
      const next = s.filter((x) => x.id !== id);
      if (next.length && !next.some((x) => x.isPrimary))
        next[0].isPrimary = true;
      return next;
    });

  const setPrimary = (id) =>
    setLocalImages((s) => s.map((x) => ({ ...x, isPrimary: x.id === id })));

  /* -------- render -------- */
  const uploadAreaContent = (
    <>
      <input {...getInputProps()} />
      <CloudUpload sx={{ fontSize: 32, color: "primary.main", mb: 0.5 }} />
      <Typography variant="body2" fontWeight={500}>
        {isDragActive ? "Drop here..." : "Upload Image"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Click or drag & drop (Max {maxImages})
      </Typography>
    </>
  );

  return (
    <Box>
      {/* When noWrapper=true, parent (ProductForm) is expected to render the outer dashed box.
          Here we render only the interactive content without Paper wrapper to avoid double box. */}
      {localImages.length < maxImages && noWrapper ? (
        <Box
          {...getRootProps()}
          sx={{ width: "100%", textAlign: "center", py: 2, cursor: "pointer" }}
        >
          {uploadAreaContent}
        </Box>
      ) : localImages.length < maxImages ? (
        <Paper
          {...getRootProps()}
          sx={{
            p: 2,
            mb: 2,
            border: "2px dashed",
            borderColor: isDragActive ? "primary.main" : "grey.300",
            bgcolor: isDragActive ? alpha("#1976d2", 0.05) : "transparent",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: alpha("#1976d2", 0.02),
            },
          }}
        >
          {uploadAreaContent}
        </Paper>
      ) : null}

      {localImages.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            {localImages.length}/{maxImages} images
          </Typography>

          <Grid container spacing={1.5}>
            {localImages.map((img, idx) => (
              <Grid item xs={6} sm={4} md={3} key={img.id}>
                <Card
                  sx={{
                    position: "relative",
                    border: "1px solid",
                    borderColor: img.isPrimary ? "primary.main" : "grey.300",
                    transition: "all 0.2s",
                    "&:hover": { boxShadow: 2 },
                  }}
                >
                  {img.isPrimary && (
                    <Chip
                      label="Primary"
                      size="small"
                      color="primary"
                      sx={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        zIndex: 1,
                        height: 20,
                        fontSize: 10,
                      }}
                    />
                  )}
                  <CardMedia
                    component="img"
                    height="100"
                    image={img.preview || img.url}
                    alt=""
                    sx={{ objectFit: "cover" }}
                  />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ p: 0.5, bgcolor: "grey.50" }}
                  >
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => setPrimary(img.id)}
                        disabled={img.isPrimary}
                      >
                        {img.isPrimary ? (
                          <Star fontSize="small" color="primary" />
                        ) : (
                          <StarBorder fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton size="small" onClick={() => recrop(img, idx)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => removeImage(img.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <CropDialog
        open={cropOpen}
        src={cropSrc}
        onCancel={() => {
          setCropOpen(false);
          setCropSrc(null);
          setEditingIndex(null);
          setPendingFile(null);
        }}
        onApply={applyCrop}
      />
    </Box>
  );
};

export default ImageUploadManager;
