import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CategoryIcon from "@mui/icons-material/Category"; // Restored your icon
import {
  StyledFormDialog,
  formHeaderStyles,
  fieldContainerStyles,
  textFieldStyles,
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
} from "../../theme/FormStyles";

const schema = yup.object({
  name: yup.string().trim().required("Category Name is required"),
  description: yup.string().trim().required("Description is required"),
  status: yup
    .string()
    .oneOf(["Active", "Inactive"])
    .required("Status is required"),
});

export default function CategoryForm({
  open = true,
  initialData,
  onSubmit,
  onCancel,
  onClose,
  embedded = false,
}) {
  const handleClose = onCancel || onClose;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      status: initialData?.status || "Active",
    },
  });

  const inner = (
    <Box sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Box sx={fieldContainerStyles}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Category Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={textFieldStyles}
              />
            )}
          />
        </Box>

        <Box sx={fieldContainerStyles}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                multiline
                rows={4}
                fullWidth
                error={!!errors.description}
                helperText={errors.description?.message}
                sx={textFieldStyles}
              />
            )}
          />
        </Box>

        <Box sx={fieldContainerStyles}>
          <FormControl fullWidth sx={textFieldStyles}>
            <InputLabel>Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Status">
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              )}
            />
          </FormControl>
        </Box>
      </Box>
    </Box>
  );

  const actions = (
    <DialogActions sx={formActionsStyles}>
      <Button onClick={handleClose} variant="outlined" sx={cancelButtonStyles}>
        Cancel
      </Button>
      <Button
        onClick={handleSubmit(onSubmit)}
        variant="contained"
        startIcon={<SaveIcon />}
        sx={submitButtonStyles}
        disabled={isSubmitting}
      >
        {initialData ? "Update Category" : "Create Category"}
      </Button>
    </DialogActions>
  );

  if (embedded)
    return (
      <>
        {inner}
        {actions}
      </>
    );

  return (
    <StyledFormDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { bgcolor: "#fff", borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          ...formHeaderStyles,
          color: "#ffffff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CategoryIcon sx={{ fontSize: 26, color: "#fff" }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff" }}>
            {initialData ? "Edit Category" : "Add New Category"}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "#ffffff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: "#fff" }}>{inner}</DialogContent>
      {actions}
    </StyledFormDialog>
  );
}
