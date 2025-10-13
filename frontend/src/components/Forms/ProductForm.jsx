import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Typography,
  Rating,
  FormHelperText,
  Avatar,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Save,
  Cancel,
  Inventory,
  AddPhotoAlternate,
  Clear,
  AttachMoney,
  Percent,
  CloudUpload,
} from "@mui/icons-material";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { categoryService } from "../../services/categoryService";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper function to get cropped file
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

const productSchema = yup.object({
  name: yup
    .string()
    .required("Product name is required")
    .min(2, "Name must be at least 2 characters"),
  category: yup.string().required("Category selection is required"),
  originalPrice: yup
    .number()
    .typeError("Price must be a number")
    .required("Original Price is required")
    .positive("Price must be greater than 0"),
  discount: yup
    .number()
    .typeError("Discount must be a number")
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100"),
  price: yup.number(),
  company: yup.string(),
  place: yup.string(),
  rating: yup
    .number()
    .min(1, "Rating must be at least 1")
    .required("Rating is required"),
  status: yup.string().required("Status is required"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters"),
  image: yup
    .mixed()
    .test("fileSize", "File size too large (max 2MB)", (value) => {
      if (!value || !value.length) return true;
      return value[0].size <= 2000000;
    }),
});

const ProductForm = ({ initialData, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category?._id || "",
      originalPrice: initialData?.originalPrice || "",
      discount: initialData?.discount || 0,
      price: initialData?.price || "",
      company: initialData?.company || "",
      place: initialData?.place || "",
      rating: initialData?.rating || 4,
      status: initialData?.status || "Active",
      description: initialData?.description || "",
      image: null,
    },
  });

  const originalPrice = watch("originalPrice");
  const discount = watch("discount");
  const ratingValue = watch("rating");

  // Set initial image preview from existing product images
  useEffect(() => {
    if (initialData?.images && initialData.images.length > 0) {
      const primaryImage =
        initialData.images.find((img) => img.isPrimary) ||
        initialData.images[0];
      if (primaryImage) {
        const fullImageUrl = `${API_BASE_URL}${primaryImage.imageUrl}`;
        setImagePreview(fullImageUrl);
        console.log("📸 Setting existing image preview:", fullImageUrl);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (originalPrice && discount >= 0) {
      const finalPrice =
        parseFloat(originalPrice) -
        (parseFloat(originalPrice) * parseFloat(discount)) / 100;
      setValue("price", finalPrice.toFixed(2), { shouldValidate: true });
    }
  }, [originalPrice, discount, setValue]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getCategories({ limit: 100 });
        setCategories(
          response.data.categories.filter((cat) => cat.status === "Active")
        );
      } catch (error) {
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setOriginalFile(file);
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setCropDialogOpen(true);
      });
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

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current || !originalFile) {
      toast.error("Please crop the image first");
      return;
    }

    try {
      const croppedFile = await getCroppedFile(
        imgRef.current,
        completedCrop,
        originalFile.name
      );

      // Create preview URL
      const previewUrl = URL.createObjectURL(croppedFile);
      setImagePreview(previewUrl);

      // Set the cropped file to form
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);
      setValue("image", dataTransfer.files);

      setCropDialogOpen(false);
      setImgSrc("");
      toast.success("Image cropped successfully!");
    } catch (error) {
      toast.error("Failed to crop image");
      console.error("Crop error:", error);
    }
  };

  const handleFormSubmit = (data) => {
    const finalData = { ...data, image: data.image ? data.image[0] : null };
    console.log("📤 Submitting form data:", {
      ...finalData,
      image: finalData.image ? "File attached" : "No file",
    });
    onSubmit(finalData);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setValue("image", null);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Image Upload Section - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: "2px dashed",
                borderColor: errors.image ? "error.main" : "primary.light",
                borderRadius: 2,
                bgcolor: "rgba(76, 175, 80, 0.02)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Avatar
                  src={imagePreview}
                  variant="rounded"
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: "grey.200",
                    border: "3px solid",
                    borderColor: "primary.main",
                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                  }}
                >
                  <Inventory sx={{ fontSize: 56, color: "primary.main" }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Product Image {!initialData && "*"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<CloudUpload />}
                      sx={{
                        background:
                          "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                        boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                      }}
                    >
                      {imagePreview ? "Change Image" : "Upload Image"}
                      <input
                        type="file"
                        hidden
                        onChange={onSelectFile}
                        accept="image/*"
                      />
                    </Button>
                    {imagePreview && (
                      <IconButton
                        color="error"
                        onClick={handleClearImage}
                        sx={{ bgcolor: "error.lighter" }}
                      >
                        <Clear />
                      </IconButton>
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ color: "text.secondary" }}
                  >
                    📸 Allowed: JPEG, JPG, PNG, GIF (Max 2MB) • Image will be
                    cropped automatically
                  </Typography>
                  {errors.image && (
                    <FormHelperText error>
                      {errors.image.message}
                    </FormHelperText>
                  )}
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Product Name - Full Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Product Name *"
                  placeholder="e.g., Samsung Galaxy S21, iPhone 13 Pro"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "primary.main" },
                      "&.Mui-focused fieldset": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              )}
            />
          </motion.div>

          {/* Category - Full Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <FormControl fullWidth error={!!errors.category}>
              <InputLabel>Category *</InputLabel>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Category *" disabled={loading}>
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.category && (
                <FormHelperText>{errors.category.message}</FormHelperText>
              )}
            </FormControl>
          </motion.div>

          {/* Pricing Section - 3 Columns in One Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="originalPrice"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Original Price *"
                      type="number"
                      error={!!errors.originalPrice}
                      helperText={errors.originalPrice?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney sx={{ color: "primary.main" }} />₹
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="discount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Discount"
                      type="number"
                      error={!!errors.discount}
                      helperText={errors.discount?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Percent sx={{ color: "primary.main" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">%</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Final Price (Auto)"
                      type="number"
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          bgcolor: "rgba(76, 175, 80, 0.08)",
                          fontWeight: 600,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </motion.div>

          {/* Status - Full Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Status *</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Status *">
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                )}
              />
              {errors.status && (
                <FormHelperText>{errors.status.message}</FormHelperText>
              )}
            </FormControl>
          </motion.div>

          {/* Company/Brand - Full Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Company / Brand Name"
                  placeholder="e.g., Samsung, Apple, Nike, Adidas"
                />
              )}
            />
          </motion.div>

          {/* Place - Full Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Controller
              name="place"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Place / Country of Origin"
                  placeholder="e.g., India, USA, China, Japan"
                />
              )}
            />
          </motion.div>

          {/* Rating - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "rgba(76, 175, 80, 0.02)",
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Product Rating *
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <Rating
                      {...field}
                      value={Number(field.value)}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      size="large"
                      precision={0.5}
                    />
                  )}
                />
                <Chip
                  label={ratingValue ? `${ratingValue} / 5 Stars` : "Not Rated"}
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                />
              </Box>
              {errors.rating && (
                <FormHelperText error>{errors.rating.message}</FormHelperText>
              )}
            </Paper>
          </motion.div>

          {/* Description - Full Width at Bottom */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Product Description *"
                  placeholder="Write detailed product description..."
                  multiline
                  rows={4}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "primary.main" },
                      "&.Mui-focused fieldset": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              )}
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                pt: 2,
                borderTop: "2px solid",
                borderColor: "divider",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={onCancel}
                sx={{ minWidth: 140, py: 1.2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
                sx={{
                  minWidth: 140,
                  py: 1.2,
                  background:
                    "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                  fontWeight: 600,
                }}
              >
                {initialData ? "Update Product" : "Add Product"}
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Box>

      {/* Image Crop Dialog */}
      <Dialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Crop Product Image
          </Typography>
          <IconButton
            onClick={() => setCropDialogOpen(false)}
            sx={{ color: "white" }}
          >
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {imgSrc && (
            <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={{ maxWidth: "100%" }}
                />
              </ReactCrop>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setCropDialogOpen(false)}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCrop}
            variant="contained"
            startIcon={<Save />}
            sx={{
              minWidth: 120,
              background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
            }}
          >
            Save Cropped Image
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductForm;
