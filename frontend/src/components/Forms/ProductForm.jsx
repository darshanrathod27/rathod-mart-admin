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
  Alert,
} from "@mui/material";
import { Save as SaveIcon, Add as AddIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import ImageUploadManager from "../ImageUpload/ImageUploadManager";
import VariantManager from "./VariantManager";

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
  discountPrice: yup
    .number()
    .min(0, "Discount price must be positive")
    .test(
      "discount-less-than-base",
      "Discount price must be less than base price",
      function (value) {
        return !value || value < this.parent.basePrice;
      }
    ),
});

const ProductForm = ({
  initialData = null,
  onSubmit,
  loading = false,
  categories = [],
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [images, setImages] = useState(initialData?.images || []);
  const [variants, setVariants] = useState(initialData?.variants || []);
  const [tags, setTags] = useState(initialData?.tags || []);
  const [features, setFeatures] = useState(initialData?.features || []);
  const [specifications, setSpecifications] = useState(
    initialData?.specifications || []
  );

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
      status: initialData?.status || "draft",
      featured: initialData?.featured || false,
      trending: initialData?.trending || false,
    },
  });

  const handleFormSubmit = (data) => {
    const formData = {
      ...data,
      images,
      variants,
      tags,
      features,
      specifications,
      totalStock: variants.reduce(
        (sum, variant) => sum + (variant.stock || 0),
        0
      ),
    };

    onSubmit(formData);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const updateSpecification = (index, field, value) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const removeSpecification = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
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
            <Tab label="Variants" />
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

              <Grid container spacing={2}>
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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

        {/* Variants Tab */}
        <TabPanel value={activeTab} index={2}>
          <VariantManager
            variants={variants}
            onVariantsChange={setVariants}
            productName={watch("name")}
          />
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={activeTab} index={3}>
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

              <Box sx={{ mt: 3 }}>
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

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Specifications</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addSpecification}
                  size="small"
                >
                  Add Spec
                </Button>
              </Box>

              {specifications.map((spec, index) => (
                <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Specification"
                    value={spec.key}
                    onChange={(e) =>
                      updateSpecification(index, "key", e.target.value)
                    }
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Value"
                    value={spec.value}
                    onChange={(e) =>
                      updateSpecification(index, "value", e.target.value)
                    }
                    size="small"
                  />
                  <Button
                    color="error"
                    onClick={() => removeSpecification(index)}
                    size="small"
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Grid>
          </Grid>
        </TabPanel>

        {/* SEO & Settings Tab */}
        <TabPanel value={activeTab} index={4}>
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
};

export default ProductForm;
