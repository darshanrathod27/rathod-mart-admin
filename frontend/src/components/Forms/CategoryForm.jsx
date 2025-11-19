// src/components/Forms/CategoryForm.jsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
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
import CategoryIcon from "@mui/icons-material/Category";
import {
  StyledFormDialog,
  formHeaderStyles,
  fieldContainerStyles,
  textFieldStyles,
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
} from "../../theme/FormStyles";

export default function CategoryForm({
  open = true,
  initialData,
  onSubmit,
  onCancel,
  onClose,
  embedded = false,
}) {
  const handleClose = onCancel || onClose;

  const { control, handleSubmit } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      status: initialData?.status || "Active",
    },
  });

  const submit = (vals) => onSubmit?.(vals);

  const inner = (
    <Box sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(submit)}>
        <Box sx={fieldContainerStyles}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Category Name"
                required
                fullWidth
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
                sx={textFieldStyles}
              />
            )}
          />
        </Box>

        <Box sx={fieldContainerStyles}>
          <FormControl fullWidth size="medium" sx={textFieldStyles}>
            <InputLabel id="cat-status-label">Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select labelId="cat-status-label" label="Status" {...field}>
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
        onClick={handleSubmit(submit)}
        variant="contained"
        startIcon={<SaveIcon />}
        sx={submitButtonStyles}
      >
        {initialData ? "Update Category" : "Create Category"}
      </Button>
    </DialogActions>
  );

  if (embedded) {
    return (
      <>
        {inner}
        {actions}
      </>
    );
  }

  return (
    <StyledFormDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#fff",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 12px 48px rgba(76, 175, 80, 0.25)",
        },
      }}
      BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.55)" } }}
    >
      <DialogTitle
        sx={{
          ...formHeaderStyles,
          color: "#ffffff",
          position: "relative",
          zIndex: 1,
          m: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CategoryIcon sx={{ fontSize: 26, color: "#fff" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "20px", color: "#fff" }}
          >
            {initialData ? "Edit Category" : "Add New Category"}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: "#ffffff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
          }}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: "#fff" }}>{inner}</DialogContent>
      {actions}
    </StyledFormDialog>
  );
}
