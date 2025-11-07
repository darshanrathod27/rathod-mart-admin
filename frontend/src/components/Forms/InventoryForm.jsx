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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { inventoryService } from "../../services/inventoryService";

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
    formState: { errors },
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
        // inventoryService.getProductVariants should return array or { data: [...] }
        const list = await inventoryService.getProductVariants(productId);
        setVariants(Array.isArray(list) ? list : list?.data || []);
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
    <Box
      component="form"
      onSubmit={handleSubmit(submit)}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <FormControl fullWidth>
        <InputLabel>Variant (optional)</InputLabel>
        <Controller
          name="variant"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Variant (optional)"
              disabled={loading || variants.length === 0}
            >
              <MenuItem value="">
                <em>Base product stock</em>
              </MenuItem>
              {(variants || []).map((v) => (
                <MenuItem key={v._id} value={v._id}>
                  {`${v?.size?.sizeName || ""}${v?.size ? " • " : ""}${
                    v?.color?.colorName || ""
                  }`}
                </MenuItem>
              ))}
            </Select>
          )}
        />
        <FormHelperText>
          Leave blank to adjust base product stock; or choose a specific
          variant.
        </FormHelperText>
      </FormControl>

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
          />
        )}
      />

      <Box sx={{ display: "flex", gap: 2, mt: 1, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          {mode === "add" ? "Add Stock" : "Reduce Stock"}
        </Button>
      </Box>
    </Box>
  );
};

export default InventoryForm;
