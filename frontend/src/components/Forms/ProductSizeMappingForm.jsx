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
  DialogActions,
} from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";
import { productService } from "../../services/productService";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  textFieldStyles,
} from "../../theme/FormStyles";
import FormAutocomplete from "./FormAutocomplete";

// --- Validation Schema ---
const schema = yup.object({
  product: yup.string().required("Product is required"),
  sizeName: yup.string().trim().required("Size Name is required"),
  value: yup.string().trim().required("Size Value is required"),
  status: yup.string().required("Status is required"),
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
    resolver: yupResolver(schema),
    defaultValues: {
      product: initialData?.product?._id || initialData?.product || "",
      sizeName: initialData?.sizeName || "",
      value: initialData?.value || "",
      status: initialData?.status || "Active",
    },
  });

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
      } catch (err) {
        toast.error(err.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Sync Initial Data
  useEffect(() => {
    if (!initialData) return;
    if (initialData.product) {
      setValue(
        "product",
        (initialData.product && initialData.product._id) || initialData.product
      );
    }
    if (initialData.sizeName) setValue("sizeName", initialData.sizeName);
    if (initialData.value) setValue("value", initialData.value);
    if (initialData.status) setValue("status", initialData.status);
  }, [initialData, setValue]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Product Selection */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
          >
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
          </motion.div>

          {/* Size Name */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Controller
              name="sizeName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Size Name"
                  placeholder="e.g. Small, Medium, Large"
                  error={!!errors.sizeName}
                  helperText={errors.sizeName?.message}
                  sx={textFieldStyles}
                />
              )}
            />
          </motion.div>

          {/* Size Value */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Controller
              name="value"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Size Value"
                  placeholder="e.g. S, M, L, XL"
                  error={!!errors.value}
                  helperText={errors.value?.message}
                  sx={textFieldStyles}
                />
              )}
            />
          </motion.div>

          {/* Status */}
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
          </motion.div>
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
export default ProductSizeMappingForm;
