import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  IconButton,
  DialogActions,
  Stack,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CategoryIcon from "@mui/icons-material/Category";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  StyledFormDialog,
  formHeaderStyles,
  fieldContainerStyles,
  textFieldStyles,
  formActionsStyles,
  cancelButtonStyles,
  submitButtonStyles,
  sectionHeaderStyles,
} from "../../theme/FormStyles";

// --- Validation Schema ---
const schema = yup.object({
  name: yup.string().trim().required("Category name is required"),
  description: yup.string().trim().required("Description is required"),
  status: yup.string().required("Status is required"),
});

export default function CategoryForm({
  open = true,
  initialData,
  onSubmit,
  onCancel,
  onClose,
  embedded = false,
}) {
  const isEdit = Boolean(initialData && initialData._id);
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
      status: initialData?.status || "active",
    },
  });

  const submit = (vals) => onSubmit?.(vals);

  const formInner = (
    <Box sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
        {/* Section: Basic Information */}
        <Box sx={{ ...fieldContainerStyles }}>
          <Typography sx={sectionHeaderStyles}>
            <InfoOutlinedIcon sx={{ fontSize: 20 }} />
            Basic Information
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Category Name"
                  fullWidth
                  required
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={textFieldStyles}
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
                  required
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Write a brief description..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  sx={textFieldStyles}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  error={!!errors.status}
                  helperText={errors.status?.message}
                  sx={textFieldStyles}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              )}
            />
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  const actions = (
    <DialogActions sx={formActionsStyles}>
      <Button
        onClick={handleClose}
        variant="outlined"
        startIcon={<CloseIcon />}
        sx={cancelButtonStyles}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit(submit)}
        variant="contained"
        startIcon={<SaveIcon />}
        disabled={isSubmitting}
        sx={submitButtonStyles}
      >
        {isSubmitting
          ? "Saving..."
          : isEdit
          ? "Update Category"
          : "Create Category"}
      </Button>
    </DialogActions>
  );

  if (embedded) {
    return (
      <>
        {formInner}
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
      {/* Header - Fixed "Double Header" Issue by using Box instead of DialogTitle */}
      <Box sx={{ ...formHeaderStyles }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", px: 3, py: 1.25 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <CategoryIcon sx={{ fontSize: 24, color: "#fff" }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, fontSize: "20px", color: "#fff" }}
            >
              {isEdit ? "Edit Category" : "Add New Category"}
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ p: 0, bgcolor: "#fff" }}>{formInner}</Box>
      {actions}
    </StyledFormDialog>
  );
}

CategoryForm.propTypes = {
  open: PropTypes.bool,
  initialData: PropTypes.object,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  onClose: PropTypes.func,
  embedded: PropTypes.bool,
};
