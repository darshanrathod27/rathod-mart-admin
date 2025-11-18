// frontend/src/components/Forms/PromocodeForm.jsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  DialogActions,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/CloseOutlined";
import {
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  textFieldStyles,
} from "../../theme/FormStyles";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Schema remains the same
const schema = yup.object({
  code: yup.string().trim().uppercase().required("Code is required"),
  description: yup.string().trim().optional(),
  discountType: yup.string().oneOf(["Percentage", "Fixed"]).required(),
  discountValue: yup.number().typeError("Must be a number").min(0).required(),
  minPurchase: yup.number().typeError("Must be a number").min(0).default(0),
  maxDiscount: yup
    .number()
    .typeError("Must be a number")
    .min(0)
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    ),
  expiresAt: yup.string().nullable(),
  status: yup.string().oneOf(["Active", "Inactive"]).required(),
  maxUses: yup
    .number()
    .typeError("Must be a number")
    .min(1, "Must be at least 1")
    .required("Max uses is required"),
});

const formatDateForInput = (date) => {
  if (!date) return "";
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

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
      maxDiscount: initialData?.maxDiscount || "",
      expiresAt: formatDateForInput(initialData?.expiresAt),
      status: initialData?.status || "Active",
      maxUses: initialData?.maxUses || 1,
    },
  });

  const discountType = watch("discountType");

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ p: 3 }}>
          {/* --- GRID LAYOUT UPDATED --- */}
          <Grid container spacing={2.5}>
            {/* Each item is now xs={12} to be full-width */}
            <Grid item xs={12}>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Promocode"
                    required
                    fullWidth
                    sx={textFieldStyles}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    InputProps={{
                      style: { textTransform: "uppercase" },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={textFieldStyles}>
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" {...field}>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                    sx={textFieldStyles}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="discountType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={textFieldStyles}>
                    <InputLabel>Discount Type</InputLabel>
                    <Select label="Discount Type" {...field}>
                      <MenuItem value="Percentage">Percentage</MenuItem>
                      <MenuItem value="Fixed">Fixed</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="discountValue"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Discount Value"
                    required
                    fullWidth
                    type="number"
                    sx={textFieldStyles}
                    error={!!errors.discountValue}
                    helperText={errors.discountValue?.message}
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
            {discountType === "Percentage" && (
              <Grid item xs={12}>
                <Controller
                  name="maxDiscount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Max Discount (Optional)"
                      fullWidth
                      type="number"
                      sx={textFieldStyles}
                      error={!!errors.maxDiscount}
                      helperText="Max discount amount (e.g., 500)"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Controller
                name="minPurchase"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Minimum Purchase"
                    fullWidth
                    type="number"
                    sx={textFieldStyles}
                    error={!!errors.minPurchase}
                    helperText="Minimum cart value to apply"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="maxUses"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Max Total Uses"
                    fullWidth
                    required
                    type="number"
                    sx={textFieldStyles}
                    error={!!errors.maxUses}
                    helperText={
                      errors.maxUses?.message || "Total uses for this code"
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="expiresAt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Expiry Date (Optional)"
                    type="date"
                    fullWidth
                    sx={textFieldStyles}
                    error={!!errors.expiresAt}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>

        <DialogActions sx={formActionsStyles}>
          <Button
            onClick={onCancel}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={cancelButtonStyles}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            sx={submitButtonStyles}
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : initialData
              ? "Update Code"
              : "Create Code"}
          </Button>
        </DialogActions>
      </Box>
    </Box>
  );
}
