// frontend/src/components/Forms/InventoryForm.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  DialogActions,
  InputAdornment,
  Divider,
  Stack,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Cancel, Save, Inventory, EditNote } from "@mui/icons-material";
import toast from "react-hot-toast";
import { inventoryService } from "../../services/inventoryService";
import { productService } from "../../services/productService";
import FormAutocomplete from "./FormAutocomplete";
import {
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  textFieldStyles,
} from "../../theme/FormStyles";

const schema = yup.object({
  product: yup.string().required("Product is required"),
  variant: yup.string().nullable(),
  quantity: yup
    .number()
    .typeError("Enter a valid number")
    .positive("Must be greater than 0")
    .integer("Must be a whole number")
    .required("Quantity is required"),
  remarks: yup.string().max(200, "Max 200 characters").nullable(),
});

const InventoryForm = ({ mode = "add", initialData, onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const isAdd = mode === "add";

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      product: initialData?.product?._id || "",
      variant: initialData?.variant?._id || "",
      quantity: "",
      remarks: "",
    },
  });

  const selectedProductId = watch("product");

  // 1. Load Products (Active Only)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productService.getProducts({
          limit: 2000,
          status: "active",
        });
        setProducts(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Load Variants when Product changes
  useEffect(() => {
    if (!selectedProductId) {
      setVariants([]);
      return;
    }
    const fetchVariants = async () => {
      setLoadingVariants(true);
      try {
        const res = await inventoryService.getProductVariants(
          selectedProductId
        );
        const variantList = (Array.isArray(res) ? res : res?.data || []).map(
          (v) => ({
            _id: v._id,
            name: `${v.size?.sizeName || "Std"} / ${
              v.color?.colorName || "Std"
            } (Curr: ${v.currentStock || 0})`,
          })
        );
        setVariants(variantList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingVariants(false);
      }
    };
    fetchVariants();
  }, [selectedProductId]);

  // 3. Pre-fill Data
  useEffect(() => {
    if (initialData?.product) setValue("product", initialData.product._id);
    if (initialData?.variant) setValue("variant", initialData.variant._id);
  }, [initialData, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        product: data.product,
        variant: data.variant || undefined,
        quantity: Number(data.quantity),
        remarks:
          data.remarks || (isAdd ? "Manual Restock" : "Manual Adjustment"),
      };

      if (isAdd) await inventoryService.addStock(payload);
      else await inventoryService.reduceStock(payload);

      onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.message || "Operation failed");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Fields Container */}
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <FormAutocomplete
          control={control}
          name="product"
          label="Select Product"
          options={products}
          loading={loadingProducts}
          disabled={!!initialData?.product} // Lock if clicked from row
          error={!!errors.product}
          helperText={errors.product?.message}
          sx={textFieldStyles}
        />

        <FormAutocomplete
          control={control}
          name="variant"
          label="Select Variant (Optional)"
          options={variants}
          loading={loadingVariants}
          disabled={!selectedProductId || !!initialData?.variant}
          error={!!errors.variant}
          helperText="Select variant to adjust specific stock"
          sx={textFieldStyles}
        />

        <Stack direction="row" spacing={2}>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label="Quantity"
                placeholder="0"
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />
            )}
          />
        </Stack>

        <Controller
          name="remarks"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Remarks / Reason"
              placeholder={
                isAdd ? "e.g., New Shipment" : "e.g., Damaged / Lost"
              }
              multiline
              rows={2}
              error={!!errors.remarks}
              helperText={errors.remarks?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EditNote fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyles}
            />
          )}
        />
      </Box>

      <Divider />

      <DialogActions sx={{ ...formActionsStyles, px: 3, py: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={cancelButtonStyles}
          startIcon={<Cancel />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{
            ...submitButtonStyles,
            background: isAdd
              ? "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)"
              : "linear-gradient(135deg, #EF5350 0%, #C62828 100%)",
            "&:hover": {
              background: isAdd
                ? "linear-gradient(135deg, #43A047 0%, #1B5E20 100%)"
                : "linear-gradient(135deg, #E53935 0%, #B71C1C 100%)",
            },
          }}
          startIcon={<Save />}
        >
          {isAdd ? "Add Stock" : "Reduce Stock"}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default InventoryForm;
