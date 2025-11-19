// src/components/Forms/InventoryForm.jsx
import React, { useEffect, useState } from "react";
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
  DialogActions,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { inventoryService } from "../../services/inventoryService";
import {
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  textFieldStyles,
} from "../../theme/FormStyles";
import { Save, Cancel } from "@mui/icons-material";
import FormAutocomplete from "./FormAutocomplete"; // <--- IMPORTED

const schema = yup.object({
  variant: yup.string().nullable(),
  quantity: yup
    .number()
    .typeError("Enter a number")
    .positive("Must be > 0")
    .required("Quantity is required"),
  remarks: yup.string().max(120, "Max 120 chars").nullable(),
});

const InventoryForm = ({ productId, mode = "add", onClose, onSuccess }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { variant: "", quantity: "", remarks: "" },
  });

  useEffect(() => {
    const loadVariants = async () => {
      if (!productId) {
        setVariants([]);
        return;
      }
      try {
        setLoading(true);
        const list = await inventoryService.getProductVariants(productId);
        // Normalize for Autocomplete
        const mappedList = (Array.isArray(list) ? list : list?.data || []).map(
          (v) => ({
            _id: v._id || v.id,
            name: `${v?.size?.sizeName || ""}${v?.size ? " • " : ""}${
              v?.color?.colorName || ""
            }`,
          })
        );
        setVariants(mappedList);
      } catch {
        setVariants([]);
      } finally {
        setLoading(false);
      }
    };
    loadVariants();
  }, [productId]);

  const submit = async (data) => {
    try {
      if (!productId) {
        toast.error("Select a product first");
        return;
      }
      const payload = {
        product: productId,
        variant: data.variant || undefined,
        quantity: Number(data.quantity),
        remarks:
          data.remarks || (mode === "add" ? "Stock added" : "Stock reduced"),
      };
      if (mode === "add") {
        await inventoryService.addStock(payload);
        toast.success("Stock added");
      } else {
        await inventoryService.reduceStock(payload);
        toast.success("Stock reduced");
      }
      reset();
      onSuccess?.();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Operation failed"
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* --- UPDATED: Advanced Variant Search --- */}
        <FormAutocomplete
          control={control}
          name="variant"
          label="Variant (optional)"
          options={variants}
          loading={loading}
          disabled={loading || variants.length === 0}
          helperText="Leave blank to adjust base product stock"
          sx={textFieldStyles}
        />

        <Controller
          name="quantity"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="number"
              label="Quantity"
              error={!!errors.quantity}
              helperText={errors.quantity?.message}
              fullWidth
              sx={textFieldStyles}
            />
          )}
        />

        <Controller
          name="remarks"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Remarks"
              placeholder={
                mode === "add"
                  ? "Purchase / Restock note"
                  : "Sale / Adjustment note"
              }
              error={!!errors.remarks}
              helperText={errors.remarks?.message}
              fullWidth
              multiline
              maxRows={3}
              sx={textFieldStyles}
            />
          )}
        />
      </Box>

      <DialogActions sx={formActionsStyles}>
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
          sx={submitButtonStyles}
          startIcon={<Save />}
          disabled={isSubmitting}
        >
          {mode === "add" ? "Add Stock" : "Reduce Stock"}
        </Button>
      </DialogActions>
    </Box>
  );
};
export default InventoryForm;
