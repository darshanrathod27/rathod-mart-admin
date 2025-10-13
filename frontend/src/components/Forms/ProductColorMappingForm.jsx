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
} from "@mui/material";
import { Save, Cancel, Palette, ColorLens } from "@mui/icons-material";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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

const colorMappingSchema = yup.object({
  product: yup.string().required("Product selection is required"),
  colorName: yup.string().required("Color name is required"),
  value: yup
    .string()
    .required("Color value is required")
    .matches(/^#[0-9A-F]{6}$/i, "Invalid hex color format"),
  status: yup.string().required("Status is required"),
});

const ProductColorMappingForm = ({ initialData, onSubmit, onCancel }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(colorMappingSchema),
    defaultValues: initialData || {
      product: "",
      colorName: "",
      value: "#000000",
      status: "Active",
    },
  });

  const colorValue = watch("value");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProducts({ limit: 100 });
        setProducts(
          response.data.products.filter((prod) => prod.status === "Active")
        );
      } catch (error) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handlePresetColorClick = (color) => {
    setValue("value", color.value);
    setValue("colorName", color.name);
    setSelectedColor(color.value);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FormControl fullWidth error={!!errors.product}>
              <InputLabel>Product *</InputLabel>
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Product *" disabled={loading}>
                    <MenuItem value="">Select Product</MenuItem>
                    {products.map((prod) => (
                      <MenuItem key={prod._id} value={prod._id}>
                        {prod.name}
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

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Controller
              name="colorName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Color Name *"
                  placeholder="e.g., Red, Blue, Green"
                  error={!!errors.colorName}
                  helperText={errors.colorName?.message}
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <ColorLens sx={{ color: "primary.main" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Select Color
                </Typography>
                <Chip
                  label={`${PRESET_COLORS.length} Colors`}
                  size="small"
                  sx={{
                    ml: "auto",
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Grid container spacing={1.5}>
                <AnimatePresence>
                  {PRESET_COLORS.map((color, index) => (
                    <Grid item xs={3} sm={2.4} md={2} key={color.name}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Box
                          onClick={() => handlePresetColorClick(color)}
                          sx={{ cursor: "pointer", textAlign: "center" }}
                        >
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,
                              bgcolor: color.value,
                              border:
                                colorValue === color.value
                                  ? "3px solid #4CAF50"
                                  : "2px solid #ccc",
                              margin: "0 auto",
                              boxShadow:
                                colorValue === color.value
                                  ? "0 0 16px rgba(76, 175, 80, 0.6)"
                                  : "0 2px 8px rgba(0,0,0,0.1)",
                              transition: "all 0.3s",
                            }}
                          >
                            {" "}
                          </Avatar>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              fontWeight:
                                colorValue === color.value ? 700 : 500,
                              color:
                                colorValue === color.value
                                  ? "primary.main"
                                  : "text.secondary",
                            }}
                          >
                            {color.name}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
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
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                          setSelectedColor(e.target.value);
                        }}
                        style={{
                          width: "70px",
                          height: "70px",
                          border: "3px solid #4CAF50",
                          borderRadius: "12px",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                        }}
                      />
                      <TextField
                        {...field}
                        fullWidth
                        label="Hex Color Code"
                        placeholder="#000000"
                        error={!!errors.value}
                        helperText={
                          errors.value?.message ||
                          "Click color box or enter hex code"
                        }
                        inputProps={{
                          style: {
                            textTransform: "uppercase",
                            fontWeight: 600,
                          },
                        }}
                      />
                    </>
                  )}
                />
                <Avatar
                  sx={{
                    width: 70,
                    height: 70,
                    bgcolor: colorValue,
                    border: "3px solid",
                    borderColor: "divider",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  {" "}
                </Avatar>
              </Box>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                pt: 2,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={onCancel}
                sx={{ minWidth: 120 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
                sx={{
                  minWidth: 120,
                  background:
                    "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                }}
              >
                {initialData ? "Update" : "Save"}
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default ProductColorMappingForm;
