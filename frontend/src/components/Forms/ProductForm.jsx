// src/components/Forms/ProductForm.jsx
import React, { useEffect, useState } from "react";
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
  // --- NEW ---
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ImageUploadManager from "../ImageUpload/ImageUploadManager";
// --- NEW ---
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
      tags: initialData?.tags || [],
      features: initialData?.features || [],
    },
  });

  const [images, setImages] = useState(() =>
    (initialData?.images || []).map((img) => ({
      id: img._id || img.filename || `${Date.now()}-${Math.random()}`,
      filename: img.filename,
      url: img.fullUrl || img.fullImageUrl || img.url || img.imageUrl,
      alt: img.alt || "",
      isPrimary: !!img.isPrimary,
    }))
  );

  // --- NEW (Variant State) ---
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("");
  // --- END NEW ---

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
        tags: initialData?.tags || [],
        features: initialData?.features || [],
      });
      setImages(
        (initialData?.images || []).map((img) => ({
          id: img._id || img.filename || `${Date.now()}-${Math.random()}`,
          filename: img.filename,
          url: img.fullUrl || img.fullImageUrl || img.url || img.imageUrl,
          alt: img.alt || "",
          isPrimary: !!img.isPrimary,
        }))
      );
      // --- NEW (Fetch Variants on Edit) ---
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
      // --- END NEW ---
    }
  }, [initialData, reset, isEdit]);

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

  const handleImagesChange = (nextImages) => setImages(nextImages);

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
    fd.append("tags", JSON.stringify(vals.tags || []));
    fd.append("features", JSON.stringify(vals.features || []));

    // --- NEW (Append variantId if selected) ---
    // (Aapke backend 'productController' mein 'variantIdForUploads' pehle se hai)
    if (selectedVariant) {
      fd.append("variantId", selectedVariant);
    }
    // --- END NEW ---

    const existingFilenames = [];
    (images || []).forEach((img) => {
      if (img.file) {
        fd.append("images", img.file, img.file.name || `img-${Date.now()}`);
      } else if (img._localFile) {
        fd.append(
          "images",
          img._localFile,
          img._localFile.name || `img-${Date.now()}`
        );
      } else if (img.filename) {
        existingFilenames.push(img.filename);
      }
    });
    if (existingFilenames.length)
      fd.append("existingFilenames", JSON.stringify(existingFilenames));

    if (isEdit) fd.append("_id", initialData._id);
    await onSubmit(fd, { isEdit, id: initialData?._id });
  };

  /* ---------------- inner form (no nested scroll) ---------------- */
  const formInner = (
    <Box sx={{ p: 3 }}>
      <Box
        component="form"
        onSubmit={handleSubmit(submit)}
        onKeyDown={onKeyDown}
      >
        {/* Basic Information */}
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

        {/* IMAGES - single outer dashed box, same size as UserForm (minHeight 120) */}
        <Box sx={{ ...fieldContainerStyles, mb: 2 }}>
          <Typography sx={sectionHeaderStyles}>
            <ImageOutlinedIcon sx={{ fontSize: 20 }} />
            Product Images & Preview
          </Typography>

          {/* --- NEW (Variant Dropdown) --- */}
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
          {/* --- END NEW --- */}

          <Box
            sx={{
              border: "2px dashed #66BB6A",
              borderRadius: 2,
              backgroundColor: "#F1F8F1",
              p: 2,
              minHeight: "120px !important",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              "& > *": {
                minHeight: "unset !important",
                background: "transparent !important",
                border: "none !important",
                boxShadow: "none !important",
                width: "100% !important",
              },
              "& .dropzone, & .dz, &[data-dropzone]": { minHeight: 120 },
            }}
          >
            <ImageUploadManager
              images={images}
              onImagesChange={handleImagesChange}
              maxImages={15}
              noWrapper={true}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2, borderColor: "#E8F5E9" }} />

        {/* SPECS */}
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

            {/* Tags */}
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

            {/* Features */}
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
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  /* Actions - use DialogActions to match UserForm exactly */
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

  /* If embedded=true (rendered inside FormModal), return only inner + actions (no extra dialog title) */
  if (embedded) {
    return (
      <>
        {formInner}
        {actions}
      </>
    );
  }

  /* Standalone dialog (unlikely used if you place ProductForm inside FormModal) */
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
      {/* Header style will match UserForm since formHeaderStyles is same */}
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
