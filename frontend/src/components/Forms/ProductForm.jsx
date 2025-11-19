// src/components/Forms/ProductForm.jsx
import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Chip,
  Stack,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
  IconButton,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Paper,
  Card,
  CardMedia,
  CardActions,
  Tooltip,
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

/* --------------- validation schema --------------- */
const schema = yup.object({
  name: yup.string().trim().required("Product name is required"),
  description: yup.string().trim().required("Description is required"),
  category: yup.string().required("Category is required"),
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
      name: initialData?.name || "",
      description: initialData?.description || "",
      shortDescription: initialData?.shortDescription || "",
      category:
        (initialData?.category &&
          (initialData.category._id || initialData.category)) ||
        "",
      brand: initialData?.brand || "",
      basePrice: initialData?.basePrice ?? 0,
      discountPercentage:
        initialData &&
        initialData.basePrice &&
        initialData.discountPrice != null
          ? Math.round(
              ((initialData.basePrice - initialData.discountPrice) /
                initialData.basePrice) *
                100
            )
          : "",
      discountPrice: initialData?.discountPrice ?? initialData?.basePrice ?? 0,
      status: initialData?.status || "draft",
      featured: initialData?.featured || false,
      trending: initialData?.trending || false,
      // --- CHANGE: Added isBestOffer ---
      isBestOffer: initialData?.isBestOffer || false,
      // --- END CHANGE ---
      tags: initialData?.tags || [],
      features: initialData?.features || [],
    },
  });

  const [images, setImages] = useState(() =>
    (initialData?.images || []).map((img) => ({
      ...img,
      id: img._id || img.filename || `${Date.now()}-${Math.random()}`,
      previewUrl: img.fullUrl || img.fullImageUrl || img.url || img.imageUrl,
    }))
  );
  const [deleteFilenames, setDeleteFilenames] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("");

  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const tags = watch("tags") || [];
  const features = watch("features") || [];
  const basePrice = watch("basePrice");
  const discountPerc = watch("discountPercentage");

  /* recalculated discountPrice when basePrice or discountPercentage changes */
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

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData?.name || "",
        description: initialData?.description || "",
        shortDescription: initialData?.shortDescription || "",
        category:
          (initialData?.category &&
            (initialData.category._id || initialData.category)) ||
          "",
        brand: initialData?.brand || "",
        basePrice: initialData?.basePrice ?? 0,
        discountPercentage:
          initialData &&
          initialData.basePrice &&
          initialData.discountPrice != null
            ? Math.round(
                ((initialData.basePrice - initialData.discountPrice) /
                  initialData.basePrice) *
                  100
              )
            : "",
        discountPrice:
          initialData?.discountPrice ?? initialData?.basePrice ?? 0,
        status: initialData?.status || "draft",
        featured: initialData?.featured || false,
        trending: initialData?.trending || false,
        // --- CHANGE: Added isBestOffer ---
        isBestOffer: initialData?.isBestOffer || false,
        // --- END CHANGE ---
        tags: initialData?.tags || [],
        features: initialData?.features || [],
      });
      setImages(
        (initialData?.images || []).map((img) => ({
          ...img,
          id: img._id || img.filename || `${Date.now()}-${Math.random()}`,
          previewUrl:
            img.fullUrl || img.fullImageUrl || img.url || img.imageUrl,
        }))
      );
      setDeleteFilenames([]);

      const fetchVariants = async () => {
        try {
          const vRes = await inventoryService.getProductVariants(
            initialData._id
          );
          setVariants(vRes.data || vRes || []);
        } catch (e) {
          console.error("Failed to fetch variants for form", e);
          setVariants([]);
        }
      };
      if (isEdit) {
        fetchVariants();
      }
    }
  }, [initialData, reset, isEdit]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const newFileObjects = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        _localFile: file,
        previewUrl: URL.createObjectURL(file),
        alt: file.name,
        isPrimary: false,
        filename: file.name,
      }));

      setImages((prevImages) => [...prevImages, ...newFileObjects]);
    },
    [setImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const handleRemoveImage = (id, filename) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove && imageToRemove.filename && !imageToRemove._localFile) {
      setDeleteFilenames((prev) => [...prev, imageToRemove.filename]);
    }
    setImages((prevImages) => prevImages.filter((img) => img.id !== id));
  };

  const addTag = (value) => {
    const v = (value || "").trim();
    if (!v) return;
    if (!tags.includes(v))
      setValue("tags", [...tags, v], { shouldValidate: true });
    setTagInput("");
  };
  const removeTag = (index) => {
    const arr = [...tags];
    arr.splice(index, 1);
    setValue("tags", arr, { shouldValidate: true });
  };
  const addFeature = (value) => {
    const v = (value || "").trim();
    if (!v) return;
    if (!features.includes(v))
      setValue("features", [...features, v], { shouldValidate: true });
    setFeatureInput("");
  };
  const removeFeature = (index) => {
    const arr = [...features];
    arr.splice(index, 1);
    setValue("features", arr, { shouldValidate: true });
  };

  const onKeyDown = (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (e.key === "Enter" && tag !== "textarea") e.preventDefault();
  };

  const submit = async (vals) => {
    const fd = new FormData();
    fd.append("name", vals.name);
    fd.append("description", vals.description);
    if (vals.shortDescription)
      fd.append("shortDescription", vals.shortDescription);
    fd.append("category", vals.category);
    if (vals.brand) fd.append("brand", vals.brand);
    fd.append("basePrice", String(vals.basePrice));
    if (vals.discountPrice !== undefined && vals.discountPrice !== null)
      fd.append("discountPrice", String(vals.discountPrice));
    if (
      vals.discountPercentage !== undefined &&
      vals.discountPercentage !== null
    )
      fd.append("discountPercentage", String(vals.discountPercentage));
    fd.append("status", vals.status || "draft");
    fd.append("featured", vals.featured ? "true" : "false");
    fd.append("trending", vals.trending ? "true" : "false");
    // --- CHANGE: Send isBestOffer to backend ---
    fd.append("isBestOffer", vals.isBestOffer ? "true" : "false");
    // --- END CHANGE ---
    fd.append("tags", JSON.stringify(vals.tags || []));
    fd.append("features", JSON.stringify(vals.features || []));

    if (selectedVariant) {
      fd.append("variantId", selectedVariant);
    }

    const existingFilenames = [];
    (images || []).forEach((img) => {
      if (img._localFile) {
        fd.append(
          "images",
          img._localFile,
          img._localFile.name || `img-${Date.now()}`
        );
      } else if (img.filename) {
        existingFilenames.push(img.filename);
      }
    });

    if (deleteFilenames.length > 0) {
      fd.append("deleteFilenames", JSON.stringify(deleteFilenames));
    }

    if (isEdit) fd.append("_id", initialData._id);
    await onSubmit(fd, { isEdit, id: initialData?._id });
  };

  const formInner = (
    <Box sx={{ p: 3 }}>
      <Box
        component="form"
        onSubmit={handleSubmit(submit)}
        onKeyDown={onKeyDown}
      >
        <Box sx={{ ...fieldContainerStyles, mb: 2 }}>
          <Typography sx={sectionHeaderStyles}>
            <InfoOutlinedIcon sx={{ fontSize: 20 }} />
            Basic Information
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Product Name"
                  fullWidth
                  required
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={textFieldStyles}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  fullWidth
                  required
                  size="small"
                  error={!!errors.category}
                  helperText={errors.category?.message}
                  sx={textFieldStyles}
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c._id || c.id} value={c._id || c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Brand"
                  fullWidth
                  size="small"
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
                    required
                    size="small"
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
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                    error={!!errors.discountPercentage}
                    helperText={errors.discountPercentage?.message}
                    sx={textFieldStyles}
                  />
                )}
              />

              <Controller
                name="discountPrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Final Price"
                    type="number"
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                      readOnly: true,
                    }}
                    sx={textFieldStyles}
                  />
                )}
              />
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ my: 2, borderColor: "#E8F5E9" }} />

        <Box sx={{ ...fieldContainerStyles, mb: 2 }}>
          <Typography sx={sectionHeaderStyles}>
            <ImageOutlinedIcon sx={{ fontSize: 20 }} />
            Product Images & Preview
          </Typography>

          {isEdit && variants && variants.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Assign new images to (Optional)</InputLabel>
              <Select
                value={selectedVariant}
                label="Assign new images to (Optional)"
                onChange={(e) => setSelectedVariant(e.target.value)}
                sx={textFieldStyles}
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

          <Paper
            {...getRootProps()}
            sx={{
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "#66BB6A",
              borderRadius: 2,
              backgroundColor: isDragActive ? "#E8F5E9" : "#F1F8F1",
              p: 2,
              minHeight: "120px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <Typography variant="h6" color="primary">
                Drop files here...
              </Typography>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 40, color: "#66BB6A" }} />
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Drag & drop images here, or click to browse
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  (You can add multiple images)
                </Typography>
              </>
            )}
          </Paper>

          {images.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {images.map((img) => (
                  <Grid item xs={6} sm={4} md={3} key={img.id}>
                    <Card sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={img.previewUrl}
                        alt={img.alt || "preview"}
                        sx={{ objectFit: "cover" }}
                      />
                      <CardActions
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          p: 0.5,
                        }}
                      >
                        <Tooltip title="Remove Image">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleRemoveImage(img.id, img.filename)
                            }
                            sx={{
                              bgcolor: "rgba(255, 0, 0, 0.6)",
                              color: "white",
                              "&:hover": { bgcolor: "rgba(255, 0, 0, 0.9)" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2, borderColor: "#E8F5E9" }} />

        <Box sx={{ ...fieldContainerStyles }}>
          <Typography sx={sectionHeaderStyles}>
            <SettingsOutlinedIcon sx={{ fontSize: 20 }} />
            Specifications & Details
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="shortDescription"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Short Description"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Brief product description"
                  sx={textFieldStyles}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full Description"
                  fullWidth
                  required
                  size="small"
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  placeholder="Detailed product description"
                  sx={textFieldStyles}
                />
              )}
            />

            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#2E7D32" }}
              >
                Tags
              </Typography>
              {tags.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                  {tags.map((t, idx) => (
                    <Chip
                      key={t + idx}
                      label={t}
                      size="small"
                      onDelete={() => removeTag(idx)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Stack>
              )}
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  fullWidth
                  sx={textFieldStyles}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addTag(tagInput)}
                >
                  Add
                </Button>
              </Stack>
            </Box>

            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#2E7D32" }}
              >
                Features
              </Typography>
              {features.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                  {features.map((f, idx) => (
                    <Chip
                      key={f + idx}
                      label={f}
                      size="small"
                      onDelete={() => removeFeature(idx)}
                      color="primary"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Stack>
              )}
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add feature and press Enter"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature(featureInput);
                    }
                  }}
                  fullWidth
                  sx={textFieldStyles}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addFeature(featureInput)}
                >
                  Add
                </Button>
              </Stack>
            </Box>

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  sx={textFieldStyles}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem valueValue="inactive">Inactive</MenuItem>
                </TextField>
              )}
            />

            <Stack direction="row" spacing={2}>
              <Controller
                name="featured"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch {...field} checked={!!field.value} size="small" />
                    }
                    label="Featured"
                  />
                )}
              />
              <Controller
                name="trending"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch {...field} checked={!!field.value} size="small" />
                    }
                    label="Trending"
                  />
                )}
              />
              {/* --- CHANGE: Added Best Offer Switch --- */}
              <Controller
                name="isBestOffer"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch {...field} checked={!!field.value} size="small" />
                    }
                    label="Best Offer"
                  />
                )}
              />
              {/* --- END CHANGE --- */}
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
        {submitting
          ? isEdit
            ? "Updating..."
            : "Saving..."
          : isEdit
          ? "Update Product"
          : "Create Product"}
      </Button>
    </DialogActions>
  );

  if (embedded) {
    return (
      <>
        {formInner}
        {actions}
      </>
    );
  }

  return (
    <StyledFormDialog
      open={open}
      onClose={onClose || onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#fff",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 12px 48px rgba(76, 175, 80, 0.25)",
        },
      }}
      BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.55)" } }}
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
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, fontSize: "20px", color: "#fff" }}
            >
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

ProductForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  categories: PropTypes.array,
  submitting: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  embedded: PropTypes.bool,
};

ProductForm.defaultProps = {
  initialData: null,
  onCancel: () => {},
  categories: [],
  submitting: false,
  open: true,
  onClose: undefined,
  embedded: false,
};
