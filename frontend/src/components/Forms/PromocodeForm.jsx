// src/components/Forms/PromocodeForm.jsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  TextField,
  Button,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
} from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";
import {
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  textFieldStyles,
} from "../../theme/FormStyles";

const schema = yup.object({
  code: yup.string().trim().uppercase().required("Code is required"),
  description: yup.string().optional(),
  discountType: yup.string().oneOf(["Percentage", "Fixed"]).required(),
  discountValue: yup
    .number()
    .typeError("Enter number")
    .positive()
    .required("Required"),
  minPurchase: yup.number().typeError("Enter number").min(0).default(0),
  maxUses: yup.number().typeError("Enter number").min(1).required(),
  status: yup.string().oneOf(["Active", "Inactive"]),
  expiresAt: yup.string().nullable(),
});

export default function PromocodeForm({
  initialData,
  onSubmit,
  onCancel,
  submitting,
}) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      code: initialData?.code || "",
      description: initialData?.description || "",
      discountType: initialData?.discountType || "Percentage",
      discountValue: initialData?.discountValue || "",
      minPurchase: initialData?.minPurchase || 0,
      maxUses: initialData?.maxUses || 100,
      status: initialData?.status || "Active",
      expiresAt: initialData?.expiresAt
        ? new Date(initialData.expiresAt).toISOString().split("T")[0]
        : "",
    },
  });

  const discountType = watch("discountType");

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Vertical Stack of Inputs */}
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Promo Code"
              fullWidth
              sx={textFieldStyles}
              error={!!errors.code}
              helperText={errors.code?.message}
              InputProps={{ style: { textTransform: "uppercase" } }}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              fullWidth
              multiline
              rows={2}
              sx={textFieldStyles}
            />
          )}
        />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel>Type</InputLabel>
                  <Select {...field} label="Type">
                    <MenuItem value="Percentage">Percentage</MenuItem>
                    <MenuItem value="Fixed">Fixed Amount</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller
              name="discountValue"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Value"
                  type="number"
                  fullWidth
                  sx={textFieldStyles}
                  error={!!errors.discountValue}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {discountType === "Percentage" ? "%" : "₹"}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Controller
          name="minPurchase"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Min Purchase (Base Price)"
              type="number"
              fullWidth
              sx={textFieldStyles}
            />
          )}
        />

        <Controller
          name="maxUses"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Max Usage Limit"
              type="number"
              fullWidth
              sx={textFieldStyles}
            />
          )}
        />

        <Controller
          name="expiresAt"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Expiry Date"
              type="date"
              fullWidth
              sx={textFieldStyles}
              InputLabelProps={{ shrink: true }}
            />
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth sx={textFieldStyles}>
              <InputLabel>Status</InputLabel>
              <Select {...field} label="Status">
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Box>

      <DialogActions sx={formActionsStyles}>
        <Button
          onClick={onCancel}
          variant="outlined"
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
          disabled={submitting}
        >
          Save Code
        </Button>
      </DialogActions>
    </Box>
  );
}
