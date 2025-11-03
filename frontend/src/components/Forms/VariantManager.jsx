import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Typography,
  IconButton,
  Paper,
  Divider,
  InputAdornment,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Save,
  Cancel,
  Add,
  Delete,
  ViewInAr,
  Inventory2,
  Palette,
  AspectRatio,
  AttachMoney,
} from "@mui/icons-material";
import { productService } from "../../services/productService";
import { productSizeMappingService } from "../../services/productSizeMappingService";
import { productColorMappingService } from "../../services/productColorMappingService";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const variantSchema = yup.object({
  product: yup.string().required("Product selection is required"),
  variants: yup
    .array()
    .of(
      yup.object({
        size: yup.string().required("Size is required"),
        color: yup.string().required("Color is required"),
        price: yup
          .number()
          .typeError("Price must be a number")
          .required("Price is required")
          .positive("Price must be positive"),
        status: yup.string().required("Status is required"),
      })
    )
    .min(1, "At least one variant is required"),
});

const VariantMasterForm = ({ initialData, onSubmit, onCancel }) => {
  const [products, setProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(variantSchema),
    defaultValues: initialData || {
      product: "",
      variants: [
        {
          size: "",
          color: "",
          price: "",
          status: "Active",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const selectedProduct = watch("product");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Note: This expects response.data.products, which requires Fix 1 (in my previous answer)
        // to your backend productController.js to be applied.
        const response = await productService.getProducts({ limit: 100 });
        setProducts(
          response.data.products.filter((prod) => prod.status === "Active")
        );
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const fetchSizesAndColors = async () => {
        try {
          setLoading(true);
          const [sizesRes, colorsRes] = await Promise.all([
            productSizeMappingService.getSizeMappings({
              product: selectedProduct,
              limit: 100,
              status: "Active",
            }),
            productColorMappingService.getColorMappings({
              product: selectedProduct,
              limit: 100,
              status: "Active",
            }),
          ]);

          // Access the nested 'mappings' array from the 'data' object
          const fetchedSizes = sizesRes.data?.mappings || [];
          const fetchedColors = colorsRes.data?.mappings || [];

          setSizes(fetchedSizes);
          setColors(fetchedColors);

          if (fetchedSizes.length === 0) {
            toast.error(
              "No active sizes found. Please add sizes for this product first."
            );
          }
          if (fetchedColors.length === 0) {
            toast.error(
              "No active colors found. Please add colors for this product first."
            );
          }
        } catch (error) {
          console.error("Error fetching sizes/colors:", error);
          toast.error("Failed to load sizes and colors for this product.");
          setSizes([]);
          setColors([]);
        } finally {
          setLoading(false);
        }
      };
      fetchSizesAndColors();
    } else {
      setSizes([]);
      setColors([]);
    }
  }, [selectedProduct]);

  const handleFormSubmit = (data) => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (sizes.length === 0 || colors.length === 0) {
      toast.error(
        "This product needs active sizes and colors before variants can be created."
      );
      return;
    }
    onSubmit(data);
  };

  const handleAddVariant = () => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }
    if (sizes.length === 0 || colors.length === 0) {
      toast.error("Cannot add variant without available sizes and colors.");
      return;
    }
    append({
      size: "",
      color: "",
      price: "",
      status: "Active",
    });
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
        sx={{ maxHeight: "68vh", overflowY: "auto", pr: 1 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Product Selection - Full Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FormControl fullWidth error={!!errors.product}>
              <InputLabel>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Inventory2 sx={{ fontSize: 20 }} />
                  Select Product *
                </Box>
              </InputLabel>
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Select Product *"
                    disabled={loading}
                    startAdornment={
                      loading && (
                        <InputAdornment position="start">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      )
                    }
                  >
                    <MenuItem value="">
                      <em>-- Choose a Product --</em>
                    </MenuItem>
                    {products.map((prod) => (
                      <MenuItem key={prod._id} value={prod._id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <Inventory2
                            sx={{ fontSize: 18, color: "primary.main" }}
                          />
                          <Typography>{prod.name}</Typography>
                          <Chip
                            label={prod.status}
                            size="small"
                            sx={{
                              ml: "auto",
                              bgcolor: "success.lighter",
                              color: "success.main",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.product && (
                <FormHelperText>{errors.product.message}</FormHelperText>
              )}
            </FormControl>
          </motion.div>

          {/* Warning Message for Missing Sizes/Colors */}
          {selectedProduct && (sizes.length === 0 || colors.length === 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  ⚠️ Please add{" "}
                  {sizes.length === 0 && colors.length === 0
                    ? "sizes and colors"
                    : sizes.length === 0
                    ? "sizes"
                    : "colors"}{" "}
                  for this product before creating variants.
                </Typography>
              </Alert>
            </motion.div>
          )}

          {/* Variants Section Header */}
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Product Variants
              </Typography>
              <Chip
                label={`${fields.length} Variant${
                  fields.length > 1 ? "s" : ""
                }`}
                size="small"
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddVariant}
              size="medium"
              disabled={
                !selectedProduct || sizes.length === 0 || colors.length === 0
              }
              sx={{
                background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                fontWeight: 600,
              }}
            >
              Add Variant
            </Button>
          </Box>

          {errors.variants &&
            typeof errors.variants === "object" &&
            !Array.isArray(errors.variants) && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {errors.variants.message}
              </Alert>
            )}

          {/* Variants List */}
          <AnimatePresence>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    bgcolor: "rgba(76, 175, 80, 0.02)",
                    border: "2px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  {/* Variant Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Chip
                      icon={<ViewInAr />}
                      label={`Variant #${index + 1}`}
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    />
                    {fields.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => remove(index)}
                        sx={{
                          bgcolor: "error.lighter",
                          "&:hover": { bgcolor: "error.light" },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>

                  {/* Variant Fields */}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                  >
                    {/* Size Selection - Full Width */}
                    <FormControl
                      fullWidth
                      error={!!errors.variants?.[index]?.size}
                    >
                      <InputLabel>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <AspectRatio sx={{ fontSize: 20 }} />
                          Select Size *
                        </Box>
                      </InputLabel>
                      <Controller
                        name={`variants.${index}.size`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Select Size *"
                            disabled={loading}
                          >
                            <MenuItem value="">
                              <em>-- Choose Size --</em>
                            </MenuItem>
                            {sizes.map((size) => (
                              <MenuItem key={size._id} value={size._id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    width: "100%",
                                  }}
                                >
                                  <AspectRatio
                                    sx={{ fontSize: 18, color: "primary.main" }}
                                  />
                                  <Typography sx={{ fontWeight: 600 }}>
                                    {size.sizeName}
                                  </Typography>
                                  <Chip
                                    label={size.value}
                                    size="small"
                                    sx={{
                                      ml: "auto",
                                      bgcolor: "primary.lighter",
                                      color: "primary.main",
                                      fontWeight: 600,
                                    }}
                                  />
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.variants?.[index]?.size && (
                        <FormHelperText>
                          {errors.variants[index].size.message}
                        </FormHelperText>
                      )}
                    </FormControl>

                    {/* Color Selection - Full Width */}
                    <FormControl
                      fullWidth
                      error={!!errors.variants?.[index]?.color}
                    >
                      <InputLabel>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Palette sx={{ fontSize: 20 }} />
                          Select Color *
                        </Box>
                      </InputLabel>
                      <Controller
                        name={`variants.${index}.color`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Select Color *"
                            disabled={loading}
                          >
                            <MenuItem value="">
                              <em>-- Choose Color --</em>
                            </MenuItem>
                            {colors.map((color) => (
                              <MenuItem key={color._id} value={color._id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    width: "100%",
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: color.value,
                                      border: "2px solid #ccc",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    }}
                                  >
                                    {" "}
                                  </Avatar>
                                  <Typography sx={{ fontWeight: 600 }}>
                                    {color.colorName}
                                  </Typography>
                                  <Chip
                                    label={color.value}
                                    size="small"
                                    sx={{
                                      ml: "auto",
                                      fontFamily: "monospace",
                                      fontWeight: 600,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.variants?.[index]?.color && (
                        <FormHelperText>
                          {errors.variants[index].color.message}
                        </FormHelperText>
                      )}
                    </FormControl>

                    {/* Price - Full Width */}
                    <Controller
                      name={`variants.${index}.price`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Variant Price *"
                          placeholder="Enter price for this variant"
                          error={!!errors.variants?.[index]?.price}
                          helperText={errors.variants?.[index]?.price?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney sx={{ color: "primary.main" }} />₹
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              "&:hover fieldset": {
                                borderColor: "primary.main",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "primary.main",
                                borderWidth: 2,
                              },
                            },
                          }}
                        />
                      )}
                    />

                    {/* Status - Full Width */}
                    <FormControl
                      fullWidth
                      error={!!errors.variants?.[index]?.status}
                    >
                      <InputLabel>Status *</InputLabel>
                      <Controller
                        name={`variants.${index}.status`}
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="Status *">
                            <MenuItem value="Active">
                              <Chip
                                label="Active"
                                size="small"
                                sx={{
                                  bgcolor: "success.lighter",
                                  color: "success.main",
                                  fontWeight: 600,
                                }}
                              />
                            </MenuItem>
                            <MenuItem value="Inactive">
                              <Chip
                                label="Inactive"
                                size="small"
                                sx={{
                                  bgcolor: "error.lighter",
                                  color: "error.main",
                                  fontWeight: 600,
                                }}
                              />
                            </MenuItem>
                          </Select>
                        )}
                      />
                      {errors.variants?.[index]?.status && (
                        <FormHelperText>
                          {errors.variants[index].status.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Action Buttons */}
          <Divider sx={{ my: 2 }} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                pt: 1,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={onCancel}
                sx={{ minWidth: 140, py: 1.2, fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={
                  !selectedProduct ||
                  sizes.length === 0 ||
                  colors.length === 0 ||
                  loading
                }
                sx={{
                  minWidth: 140,
                  py: 1.2,
                  background:
                    "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                  fontWeight: 600,
                }}
              >
                {initialData ? "Update Variants" : "Save All Variants"}
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default VariantMasterForm;
