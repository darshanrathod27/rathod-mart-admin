// src/components/Forms/VariantMasterForm.jsx
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
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ✅ services (paths match your structure)
import { productService } from "../../services/productService";
import { productSizeMappingService } from "../../services/productSizeMappingService";
import { productColorMappingService } from "../../services/productColorMappingService";

/* ----------------- validation ----------------- */
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

/* -------- helper: safe array extraction from any API shape -------- */
const asArray = (val) => (Array.isArray(val) ? val : []);
const extractProducts = (res) => {
  // Accepts {success,data,pagination} or {data:{products:[]}} or []…
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.products)) return res.data.products;
  if (Array.isArray(res?.products)) return res.products;
  return [];
};
const extractMappings = (res) => {
  // Accepts service-normalized {mappings} or direct {success,data} etc.
  if (Array.isArray(res?.mappings)) return res.mappings;
  if (Array.isArray(res?.data?.mappings)) return res.data.mappings;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

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
      variants: [{ size: "", color: "", price: "", status: "Active" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });
  const selectedProduct = watch("product");

  /* ----------------- load products (Active only) ----------------- */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await productService.getProducts({
          limit: 1000,
          status: "active",
        });
        let list = extractProducts(res);
        // fallback filter by status if server didn’t filter
        list = asArray(list).filter(
          (p) => String(p.status || p.state || "").toLowerCase() === "active"
        );
        setProducts(list);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* ---------- when product changes, load sizes & colors ----------- */
  useEffect(() => {
    if (!selectedProduct) {
      setSizes([]);
      setColors([]);
      return;
    }
    const fetchSizesAndColors = async () => {
      try {
        setLoading(true);
        const [sizesRes, colorsRes] = await Promise.all([
          productSizeMappingService.getSizeMappings({
            product: selectedProduct,
            limit: 500,
            status: "Active",
          }),
          productColorMappingService.getColorMappings({
            product: selectedProduct,
            limit: 500,
            status: "Active",
          }),
        ]);

        const fetchedSizes = extractMappings(sizesRes);
        const fetchedColors = extractMappings(colorsRes);

        setSizes(asArray(fetchedSizes));
        setColors(asArray(fetchedColors));

        if (fetchedSizes.length === 0) {
          toast.error("No active sizes found. Please add sizes first.");
        }
        if (fetchedColors.length === 0) {
          toast.error("No active colors found. Please add colors first.");
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
  }, [selectedProduct]);

  /* ----------------- submit handlers ----------------- */
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
    append({ size: "", color: "", price: "", status: "Active" });
  };

  /* ----------------- UI ----------------- */
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
          {/* Product */}
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

          {/* Missing sizes/colors warning */}
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

          {/* Header */}
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

          {/* Variants */}
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

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                  >
                    {/* Size */}
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

                    {/* Color */}
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
                                  />
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

                    {/* Price */}
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

                    {/* Status */}
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

          {/* Actions */}
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
