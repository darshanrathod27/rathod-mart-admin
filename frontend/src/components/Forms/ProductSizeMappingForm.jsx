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
  CircularProgress,
} from "@mui/material";
import { Save, Cancel, AspectRatio } from "@mui/icons-material";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const sizeMappingSchema = yup.object({
  product: yup.string().required("Product selection is required"),
  sizeName: yup.string().required("Size name is required"),
  value: yup.string().required("Size value is required"),
  status: yup.string().required("Status is required"),
});

const ProductSizeMappingForm = ({ initialData, onSubmit, onCancel }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(sizeMappingSchema),
    defaultValues: initialData || {
      product: "",
      sizeName: "",
      value: "",
      status: "Active",
    },
  });

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

  const formFields = [
    {
      name: "sizeName",
      label: "Size Name",
      placeholder: "e.g., Small, Medium, Large",
    },
    { name: "value", label: "Size Value", placeholder: "e.g., S, M, L, XL" },
  ];

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

          {formFields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: (index + 1) * 0.1 }}
            >
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  <TextField
                    {...controllerField}
                    fullWidth
                    label={field.label}
                    placeholder={field.placeholder}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]?.message}
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
          ))}

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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

export default ProductSizeMappingForm;
