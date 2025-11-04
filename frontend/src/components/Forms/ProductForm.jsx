import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
  Divider,
  Tabs,
  Tab,
  InputAdornment, // Added for discount %
} from "@mui/material";
import { Save as SaveIcon, Add as AddIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ImageUploadManager from "../ImageUpload/ImageUploadManager";
// import VariantManager from "./VariantManager"; // --- REMOVED ---

// Validation schema
const productSchema = yup.object({
  name: yup
    .string()
    .required("Product name is required")
    .min(2, "Name too short"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description too short"),
  category: yup.string().required("Category is required"),
  basePrice: yup
    .number()
    .required("Price is required")
    .min(0, "Price must be positive"),
  brand: yup.string(),
  shortDescription: yup.string().max(200, "Short description too long"),
  discountPrice: yup.number().min(0, "Discount price must be positive"),
  discountPercentage: yup
    .number()
    .min(0, "Discount must be at least 0%")
    .max(100, "Discount cannot exceed 100%")
    .nullable(true)
    .transform((value) => (!!value ? value : null)),
});

// Helper to get initial discount percentage
const getInitialDiscountPerc = (initialData) => {
  if (
    !initialData ||
    !initialData.basePrice ||
    initialData.discountPrice === null ||
    initialData.discountPrice === undefined
  )
    return ""; // Return empty string instead of 0
  if (initialData.basePrice === 0) return 0;
  const perc =
    (100 * (initialData.basePrice - initialData.discountPrice)) /
    initialData.basePrice;
  return perc.toFixed(0);
};

// --- FIX for typing bug: Wrap component in React.memo ---
const ProductForm = React.memo(
  ({ initialData = null, onSubmit, loading = false, categories = [] }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [images, setImages] = useState(initialData?.images || []);
    // const [variants, setVariants] = useState(initialData?.variants || []); // --- REMOVED ---
    const [tags, setTags] = useState(initialData?.tags || []);
    const [features, setFeatures] = useState(initialData?.features || []);
    // const [specifications, setSpecifications] = useState( ... ); // --- REMOVED ---

    const {
      control,
      handleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(productSchema),
      defaultValues: {
        name: initialData?.name || "",
        description: initialData?.description || "",
        shortDescription: initialData?.shortDescription || "",
        category: initialData?.category?._id || "",
        brand: initialData?.brand || "",
        basePrice: initialData?.basePrice || 0,
        discountPrice: initialData?.discountPrice || 0,
        discountPercentage: getInitialDiscountPerc(initialData), // --- ADDED ---
        status: initialData?.status || "draft",
        featured: initialData?.featured || false,
        trending: initialData?.trending || false,
      },
    });

    // --- ADDED: Watch for price/discount changes ---
    const [basePrice, discountPercentage] = watch([
      "basePrice",
      "discountPercentage",
    ]);

    // --- ADDED: Calculate discount price automatically ---
    useEffect(() => {
      const base = parseFloat(basePrice);
      const perc = parseFloat(discountPercentage);
      if (!isNaN(base) && !isNaN(perc) && perc >= 0 && perc <= 100) {
        const newDiscountPrice = base - (base * perc) / 100;
        setValue("discountPrice", newDiscountPrice.toFixed(2), {
          shouldValidate: true,
        });
      } else if (!isNaN(base) && (isNaN(perc) || perc === 0)) {
        // If discount % is empty or 0, set price to base
        setValue("discountPrice", base.toFixed(2), {
          shouldValidate: true,
        });
      }
    }, [basePrice, discountPercentage, setValue]);

    const handleFormSubmit = (data) => {
      const formData = {
        ...data,
        images,
        // variants, // --- REMOVED ---
        tags,
        features,
        // specifications, // --- REMOVED ---
        // totalStock, // --- REMOVED ---
      };
      onSubmit(formData);
    };

    // --- REMOVED: specification functions (add, update, remove) ---

    const TabPanel = ({ children, value, index }) => (
      <div hidden={value !== index}>
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
      </div>
    );

    return (
      <Paper elevation={3} sx={{ p: 3, maxHeight: "70vh", overflowY: "auto" }}>
        <Typography variant="h5" gutterBottom>
          {initialData ? "Edit Product" : "Create New Product"}
        </Typography>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
            >
              <Tab label="Basic Info" />
              <Tab label="Images" />
              {/* <Tab label="Variants" /> */} {/* --- REMOVED --- */}
              <Tab label="Details" />
              <Tab label="SEO & Settings" />
            </Tabs>
          </Box>

          {/* Basic Information Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Product Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      margin="normal"
                    />
                  )}
                />

                <Controller
                  name="shortDescription"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Short Description"
                      error={!!errors.shortDescription}
                      helperText={errors.shortDescription?.message}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Description"
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      margin="normal"
                      multiline
                      rows={4}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      margin="normal"
                      error={!!errors.category}
                    >
                      <InputLabel>Category</InputLabel>
                      <Select {...field} label="Category">
                        {categories.map((cat) => (
                          <MenuItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Brand"
                      margin="normal"
                    />
                  )}
                />

                {/* --- PRICE GRID UPDATED --- */}
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}>
                    <Controller
                      name="basePrice"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Base Price"
                          type="number"
                          error={!!errors.basePrice}
                          helperText={errors.basePrice?.message}
                          margin="normal"
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ mr: 1 }}>₹</Typography>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Controller
                      name="discountPercentage"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Discount %"
                          type="number"
                          error={!!errors.discountPercentage}
                          helperText={errors.discountPercentage?.message}
                          margin="normal"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="discountPrice"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Discount Price"
                          type="number"
                          error={!!errors.discountPrice}
                          helperText={errors.discountPrice?.message}
                          margin="normal"
                          InputProps={{
                            readOnly: true, // Make it read-only
                            startAdornment: (
                              <Typography sx={{ mr: 1 }}>₹</Typography>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Images Tab */}
          <TabPanel value={activeTab} index={1}>
            <ImageUploadManager
              images={images}
              onImagesChange={setImages}
              maxImages={10}
              folder="products"
            />
          </TabPanel>

          {/* Variants Tab --- REMOVED --- */}

          {/* Details Tab (Index updated to 2) */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={tags}
                  onChange={(e, newTags) => setTags(newTags)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Add tags..."
                      helperText="Press Enter to add tags"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mt: 0 }}>
                  <Typography variant="h6" gutterBottom>
                    Features
                  </Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={features}
                    onChange={(e, newFeatures) => setFeatures(newFeatures)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Add features..."
                        helperText="Press Enter to add features"
                      />
                    )}
                  />
                </Box>
              </Grid>

              {/* --- SPECIFICATIONS REMOVED --- */}
            </Grid>
          </TabPanel>

          {/* SEO & Settings Tab (Index updated to 3) */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                <Box sx={{ mt: 2 }}>
                  <Controller
                    name="featured"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Featured Product"
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Controller
                    name="trending"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Trending Product"
                      />
                    )}
                  />
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
              size="large"
            >
              {loading
                ? "Saving..."
                : initialData
                ? "Update Product"
                : "Create Product"}
            </Button>
          </Box>
        </form>
      </Paper>
    );
  }
);

export default ProductForm;
