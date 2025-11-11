// src/components/Forms/ProductSizeMappingForm.jsx
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
  DialogActions, // 1. Import DialogActions
} from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
// 2. Import standard styles
import {
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  textFieldStyles,
} from "../../theme/FormStyles";

const sizeMappingSchema = yup.object({
  product: yup.string().trim().required("Product selection is required"),
  sizeName: yup
    .string()
    .trim()
    .min(2, "Min 2 characters")
    .max(30, "Max 30 characters")
    .matches(/^[A-Za-z0-9\s-]+$/, "Only letters, numbers, spaces and -")
    .required("Size name is required"),
  value: yup
    .string()
    .trim()
    .max(10, "Max 10 characters")
    .transform((v) => (v ? v.toUpperCase() : v))
    .matches(/^[A-Za-z0-9-]+$/, "Only letters, numbers and -")
    .required("Size value is required"),
  status: yup
    .string()
    .oneOf(["Active", "Inactive"], "Invalid status")
    .required("Status is required"),
});

const ProductSizeMappingForm = ({ initialData, onSubmit, onCancel }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(sizeMappingSchema),
    defaultValues: {
      product:
        (initialData?.product && initialData?.product?._id) ||
        initialData?.product ||
        "",
      sizeName: initialData?.sizeName || "",
      value: initialData?.value || "",
      status: initialData?.status || "Active",
    },
  });

  // --- Load products (ACTIVE only) safely ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // ask backend for active products directly
        const res = await productService.getProducts({
          limit: 1000,
          status: "active",
        });

        // robust array extraction
        let list = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.products)) list = res.data.products;
        else if (Array.isArray(res?.products)) list = res.products;
        else if (Array.isArray(res)) list = res;

        // fallback: if API didn’t filter by status, do it here
        list = (list || []).filter(
          (p) => String(p.status || p.state || "").toLowerCase() === "active"
        );

        setProducts(list);
      } catch (err) {
        toast.error(err.message || "Failed to load products");
        setProducts([]); // keep array to avoid .map crash
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Normalize initialData.product into id for edit mode
  useEffect(() => {
    if (!initialData) return;
    if (initialData.product) {
      const id =
        (initialData.product && initialData.product._id) || initialData.product;
      setValue("product", id || "");
    }
    if (initialData.sizeName) setValue("sizeName", initialData.sizeName);
    if (initialData.value) setValue("value", initialData.value);
    if (initialData.status) setValue("status", initialData.status);
  }, [initialData, setValue]);

  const formFields = [
    {
      name: "sizeName",
      label: "Size Name",
      placeholder: "Small / Medium / Large",
    },
    { name: "value", label: "Size Value", placeholder: "S / M / L / XL" },
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* 3. Add p: 3 wrapper for content */}
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FormControl fullWidth error={!!errors.product}>
              <InputLabel>Product *</InputLabel>
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Product *"
                    disabled={loading}
                    sx={textFieldStyles} // 4. Apply style
                  >
                    <MenuItem value="">
                      <em>Select Product</em>
                    </MenuItem>
                    {(products || []).map((prod) => (
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

          {formFields.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * (i + 1) }}
            >
              <Controller
                name={f.name}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={f.label}
                    placeholder={f.placeholder}
                    error={!!errors[f.name]}
                    helperText={errors[f.name]?.message}
                    sx={textFieldStyles} // 4. Apply style
                  />
                )}
              />
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Status *</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Status *"
                    sx={textFieldStyles} // 4. Apply style
                  >
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
        </Box>

        {/* 5. Use standard DialogActions */}
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

export default ProductSizeMappingForm;
