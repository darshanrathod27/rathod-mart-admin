// src/components/Forms/ProductColorMappingForm.jsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
  Paper,
  Grid,
  Avatar,
  Chip,
  DialogActions,
} from "@mui/material";
import { Save, Cancel, ColorLens } from "@mui/icons-material";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  textFieldStyles,
} from "../../theme/FormStyles";
import FormAutocomplete from "./FormAutocomplete";

const PRESET_COLORS = [
  { name: "Red", value: "#FF0000" },
  { name: "Green", value: "#00FF00" },
  { name: "Blue", value: "#0000FF" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Orange", value: "#FFA500" },
  { name: "Purple", value: "#800080" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Brown", value: "#A52A2A" },
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Gray", value: "#808080" },
  { name: "Navy", value: "#000080" },
  { name: "Maroon", value: "#800000" },
  { name: "Teal", value: "#008080" },
  { name: "Olive", value: "#808000" },
  { name: "Cyan", value: "#00FFFF" },
  { name: "Magenta", value: "#FF00FF" },
  { name: "Lime", value: "#00FF00" },
  { name: "Indigo", value: "#4B0082" },
  { name: "Violet", value: "#EE82EE" },
];

// --- Validation Schema ---
const schema = yup.object({
  product: yup.string().required("Product is required"),
  colorName: yup.string().trim().required("Color Name is required"),
  value: yup
    .string()
    .required("Color Value is required")
    .matches(/^#[0-9A-F]{6}$/i, "Invalid hex color format (e.g. #FF0000)"),
  status: yup.string().required("Status is required"),
});

const ProductColorMappingForm = ({ initialData, onSubmit, onCancel }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      product: initialData?.product?._id || initialData?.product || "",
      colorName: initialData?.colorName || "",
      value: initialData?.value || "#000000",
      status: initialData?.status || "Active",
    },
  });

  const colorValue = watch("value");

  // Load Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await productService.getProducts({
          limit: 2000,
          status: "active",
        });
        let list = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.products)) list = res.data.products;
        else if (Array.isArray(res?.products)) list = res.products;
        else if (Array.isArray(res)) list = res;

        list = (list || []).filter(
          (p) => String(p.status || p.state || "").toLowerCase() === "active"
        );
        setProducts(list);
      } catch (e) {
        toast.error(e.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const pickPreset = (c) => {
    setValue("value", c.value, { shouldValidate: true });
    setValue("colorName", c.name, { shouldValidate: true });
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Product Selection */}
          <FormAutocomplete
            control={control}
            name="product"
            label="Product *"
            options={products}
            loading={loading}
            error={!!errors.product}
            helperText={errors.product?.message}
            sx={textFieldStyles}
          />

          {/* Color Name */}
          <Controller
            name="colorName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Color Name *"
                placeholder="e.g., Red, Blue"
                error={!!errors.colorName}
                helperText={errors.colorName?.message}
                sx={textFieldStyles}
              />
            )}
          />

          {/* Preset Colors */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "rgba(76,175,80,.02)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ColorLens sx={{ color: "primary.main" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Select Color
              </Typography>
              <Chip
                label={`${PRESET_COLORS.length} Colors`}
                size="small"
                sx={{ ml: "auto" }}
              />
            </Box>
            <Grid container spacing={1.5}>
              <AnimatePresence>
                {PRESET_COLORS.map((c, i) => (
                  <Grid item xs={3} sm={2.4} md={2} key={c.name}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: i * 0.02 }}
                      whileHover={{ scale: 1.06 }}
                    >
                      <Box
                        onClick={() => pickPreset(c)}
                        sx={{ cursor: "pointer", textAlign: "center" }}
                      >
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            bgcolor: c.value,
                            border:
                              colorValue === c.value
                                ? "3px solid #4CAF50"
                                : "2px solid #ccc",
                            margin: "0 auto",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            fontWeight: colorValue === c.value ? 700 : 500,
                            color:
                              colorValue === c.value
                                ? "primary.main"
                                : "text.secondary",
                          }}
                        >
                          {c.name}
                        </Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          </Paper>

          {/* Custom Color Picker */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Custom Color
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <>
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      style={{
                        width: 60,
                        height: 60,
                        border: "3px solid #4CAF50",
                        borderRadius: 12,
                        cursor: "pointer",
                      }}
                    />
                    <TextField
                      {...field}
                      fullWidth
                      label="Hex Color Code"
                      placeholder="#000000"
                      error={!!errors.value}
                      helperText={
                        errors.value?.message || "Click color or enter hex"
                      }
                      inputProps={{
                        style: { textTransform: "uppercase", fontWeight: 600 },
                      }}
                      sx={textFieldStyles}
                    />
                  </>
                )}
              />
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: colorValue,
                  border: "3px solid",
                  borderColor: "divider",
                }}
              />
            </Box>
          </Paper>

          {/* Status */}
          <FormControl fullWidth error={!!errors.status}>
            <InputLabel>Status *</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Status *" sx={textFieldStyles}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              )}
            />
            {errors.status && (
              <FormHelperText>{errors.status.message}</FormHelperText>
            )}
          </FormControl>
        </Box>

        <DialogActions sx={formActionsStyles}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={onCancel}
            sx={cancelButtonStyles}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={loading || isSubmitting}
            sx={submitButtonStyles}
          >
            {initialData ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Box>
  );
};
export default ProductColorMappingForm;
