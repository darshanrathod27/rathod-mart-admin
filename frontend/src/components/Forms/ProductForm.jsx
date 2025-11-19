// src/components/Forms/ProductForm.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
  IconButton,
  DialogActions,
  Grid,
  Paper,
  Card,
  CardMedia,
  CardActions,
  Tooltip,
  Chip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDropzone } from "react-dropzone";
import { inventoryService } from "../../services/inventoryService";
import FormAutocomplete from "./FormAutocomplete"; // Import the new component
import {
  StyledFormDialog,
  formHeaderStyles,
  fieldContainerStyles,
  textFieldStyles,
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  sectionHeaderStyles,
} from "../../theme/FormStyles";

/* Validation Schema */
const schema = yup.object({
  name: yup.string().trim().required("Product name is required"),
  description: yup.string().trim().required("Description is required"),
  category: yup.string().required("Category is required"),
  brand: yup.string().nullable(),
  basePrice: yup
    .number()
    .typeError("Base price must be a number")
    .min(0, "Price must be >= 0")
    .required("Base price is required"),
  discountPercentage: yup
    .number()
    .typeError("Must be a number")
    .min(0, ">= 0")
    .max(100, "<= 100")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export default function ProductForm({
  initialData = null,
  onSubmit,
  onCancel,
  categories = [],
  submitting = false,
  open = true,
  onClose,
  embedded = false,
}) {
  const isEdit = Boolean(initialData && initialData._id);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      category: "",
      brand: "",
      basePrice: 0,
      discountPercentage: "",
      discountPrice: 0,
      status: "draft",
      featured: false,
      trending: false,
      isBestOffer: false,
      tags: [],
      features: [],
    },
  });

  // Image State
  const [images, setImages] = useState([]);
  const [deleteFilenames, setDeleteFilenames] = useState([]);

  // Tags/Features State
  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const tags = watch("tags") || [];
  const features = watch("features") || [];

  // Price calculation
  const basePrice = watch("basePrice");
  const discountPerc = watch("discountPercentage");

  useEffect(() => {
    const b = parseFloat(basePrice);
    const p = parseFloat(discountPerc);
    if (!isNaN(b) && typeof p === "number" && !isNaN(p)) {
      const disc = b - (b * (p || 0)) / 100;
      setValue(
        "discountPrice",
        Number.isFinite(disc) ? Number(disc.toFixed(2)) : b
      );
    } else {
      setValue("discountPrice", isNaN(+b) ? 0 : Number((+b).toFixed(2)));
    }
  }, [basePrice, discountPerc, setValue]);

  // Initialize Data
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        description: initialData.description || "",
        shortDescription: initialData.shortDescription || "",
        category: initialData.category?._id || initialData.category || "",
        brand: initialData.brand || "",
        basePrice: initialData.basePrice ?? 0,
        discountPercentage:
          initialData.basePrice && initialData.discountPrice != null
            ? Math.round(
                ((initialData.basePrice - initialData.discountPrice) /
                  initialData.basePrice) *
                  100
              )
            : "",
        discountPrice: initialData.discountPrice ?? 0,
        status: initialData.status || "draft",
        featured: initialData.featured || false,
        trending: initialData.trending || false,
        isBestOffer: initialData.isBestOffer || false,
        tags: initialData.tags || [],
        features: initialData.features || [],
      });

      setImages(
        (initialData.images || []).map((img) => ({
          ...img,
          id: img._id || img.filename || `${Date.now()}-${Math.random()}`,
          previewUrl: img.fullUrl || img.fullImageUrl || img.url,
        }))
      );
    }
  }, [initialData, reset]);

  // Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles?.length) return;
    const newFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      _localFile: file,
      previewUrl: URL.createObjectURL(file),
      filename: file.name,
    }));
    setImages((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const handleRemoveImage = (id) => {
    const imgToRemove = images.find((i) => i.id === id);
    if (imgToRemove?.filename && !imgToRemove._localFile) {
      setDeleteFilenames((prev) => [...prev, imgToRemove.filename]);
    }
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  // Tags & Features Logic
  const handleAddArrayItem = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = type === "tags" ? tagInput : featureInput;
      const current = type === "tags" ? tags : features;
      if (val.trim() && !current.includes(val.trim())) {
        setValue(type, [...current, val.trim()], { shouldValidate: true });
        type === "tags" ? setTagInput("") : setFeatureInput("");
      }
    }
  };

  const handleRemoveArrayItem = (index, type) => {
    const current = type === "tags" ? tags : features;
    const newArr = [...current];
    newArr.splice(index, 1);
    setValue(type, newArr, { shouldValidate: true });
  };

  const submit = async (vals) => {
    const fd = new FormData();
    // Append text fields
    Object.keys(vals).forEach((key) => {
      if (key === "tags" || key === "features") {
        fd.append(key, JSON.stringify(vals[key]));
      } else if (key !== "images") {
        fd.append(key, vals[key]);
      }
    });

    // Append Images
    images.forEach((img) => {
      if (img._localFile) {
        fd.append("images", img._localFile);
      }
    });

    if (deleteFilenames.length > 0) {
      fd.append("deleteFilenames", JSON.stringify(deleteFilenames));
    }

    await onSubmit(fd, { isEdit, id: initialData?._id });
  };

  const formInner = (
    <Box sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(submit)}>
        {/* Basic Info */}
        <Box sx={{ ...fieldContainerStyles, mb: 2 }}>
          <Typography sx={sectionHeaderStyles}>
            <InfoOutlinedIcon sx={{ fontSize: 20 }} /> Basic Information
          </Typography>
          <Stack spacing={2}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Product Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={textFieldStyles}
                />
              )}
            />

            {/* ADVANCED CATEGORY DROPDOWN */}
            <FormAutocomplete
              control={control}
              name="category"
              label="Category"
              options={categories}
              error={!!errors.category}
              helperText={errors.category?.message}
            />

            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Brand"
                  fullWidth
                  sx={textFieldStyles}
                />
              )}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="basePrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Base Price"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                    error={!!errors.basePrice}
                    helperText={errors.basePrice?.message}
                    sx={textFieldStyles}
                  />
                )}
              />
              <Controller
                name="discountPercentage"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Discount %"
                    type="number"
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                    error={!!errors.discountPercentage}
                    sx={textFieldStyles}
                  />
                )}
              />
              <TextField
                label="Final Price"
                value={watch("discountPrice")}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                  readOnly: true,
                }}
                sx={textFieldStyles}
              />
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Images */}
        <Box sx={{ ...fieldContainerStyles, mb: 2 }}>
          <Typography sx={sectionHeaderStyles}>
            <ImageOutlinedIcon sx={{ fontSize: 20 }} /> Images
          </Typography>
          <Paper
            {...getRootProps()}
            sx={{
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "#66BB6A",
              bgcolor: isDragActive ? "#E8F5E9" : "#F1F8F1",
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 40, color: "#66BB6A" }} />
            <Typography variant="body2" color="textSecondary">
              Drag & drop or click to upload
            </Typography>
          </Paper>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {images.map((img) => (
              <Grid item xs={4} sm={3} key={img.id}>
                <Card sx={{ position: "relative" }}>
                  <CardMedia
                    component="img"
                    height="100"
                    image={img.previewUrl}
                    sx={{ objectFit: "contain" }}
                  />
                  <CardActions
                    sx={{ position: "absolute", top: 0, right: 0, p: 0 }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(img.id)}
                      sx={{ bgcolor: "rgba(255,255,255,0.8)" }}
                    >
                      <DeleteIcon color="error" fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Specifications */}
        <Box sx={{ ...fieldContainerStyles }}>
          <Typography sx={sectionHeaderStyles}>
            <SettingsOutlinedIcon sx={{ fontSize: 20 }} /> Specifications
          </Typography>
          <Stack spacing={2}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full Description"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  sx={textFieldStyles}
                />
              )}
            />

            {/* Tags */}
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                {tags.map((t, i) => (
                  <Chip
                    key={i}
                    label={t}
                    onDelete={() => handleRemoveArrayItem(i, "tags")}
                    size="small"
                  />
                ))}
              </Stack>
              <TextField
                placeholder="Add Tag (Press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => handleAddArrayItem(e, "tags")}
                fullWidth
                size="small"
                sx={textFieldStyles}
              />
            </Box>

            {/* Features */}
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                {features.map((f, i) => (
                  <Chip
                    key={i}
                    label={f}
                    onDelete={() => handleRemoveArrayItem(i, "features")}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <TextField
                placeholder="Add Feature (Press Enter)"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => handleAddArrayItem(e, "features")}
                fullWidth
                size="small"
                sx={textFieldStyles}
              />
            </Box>

            {/* Switches */}
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={watch("featured")}
                    onChange={(e) => setValue("featured", e.target.checked)}
                  />
                }
                label="Featured"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={watch("trending")}
                    onChange={(e) => setValue("trending", e.target.checked)}
                  />
                }
                label="Trending"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={watch("isBestOffer")}
                    onChange={(e) => setValue("isBestOffer", e.target.checked)}
                  />
                }
                label="Best Offer"
              />
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  const actions = (
    <DialogActions sx={formActionsStyles}>
      <Button
        onClick={onClose || onCancel}
        variant="outlined"
        startIcon={<CloseIcon />}
        sx={cancelButtonStyles}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit(submit)}
        variant="contained"
        startIcon={<SaveIcon />}
        sx={submitButtonStyles}
        disabled={submitting}
      >
        {isEdit ? "Update Product" : "Create Product"}
      </Button>
    </DialogActions>
  );

  if (embedded)
    return (
      <>
        {formInner}
        {actions}
      </>
    );

  return (
    <StyledFormDialog
      open={open}
      onClose={onClose || onCancel}
      maxWidth="md"
      fullWidth
    >
      <Box sx={{ ...formHeaderStyles }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", px: 3, py: 1.25 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Inventory2Icon sx={{ fontSize: 24, color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff" }}>
              {isEdit ? "Edit Product" : "Add New Product"}
            </Typography>
          </Stack>
          <IconButton onClick={onClose || onCancel} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ p: 0, bgcolor: "#fff" }}>{formInner}</Box>
      {actions}
    </StyledFormDialog>
  );
}
