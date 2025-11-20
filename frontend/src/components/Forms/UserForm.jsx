// src/components/Forms/UserForm.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  FormHelperText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/CloseOutlined";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PersonIcon from "@mui/icons-material/Person";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HomeIcon from "@mui/icons-material/Home";

// Validation Imports
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDropzone } from "react-dropzone";

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
import { createUser, updateUser } from "../../services/userService";
import toast from "react-hot-toast";

// --- Validation Schema ---
const schema = yup.object({
  name: yup.string().trim().required("Full Name is required"),
  username: yup.string().trim().optional(),
  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),
  phone: yup.string().trim().optional(),
  birthday: yup.string().nullable(),
  role: yup.string().required("Role is required"),
  status: yup.string().required("Status is required"),
  // Password: Min 6 chars. If it's an edit and field is empty, it's valid (ignored).
  password: yup
    .string()
    .transform((x) => (x === "" ? undefined : x))
    .min(6, "Password must be at least 6 characters")
    .when("$isEdit", (isEdit, schema) => {
      // If not edit (Create mode), password is required
      return isEdit
        ? schema.optional()
        : schema.required("Password is required");
    }),
  // Nested Address Object
  address: yup.object({
    street: yup.string().optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    postalCode: yup.string().optional(),
    country: yup.string().optional(),
  }),
});

export default function UserForm({
  open = true,
  initialData,
  onClose,
  onSaved,
  embedded = false,
}) {
  const isEdit = Boolean(initialData && initialData._id);

  // Format date for input type=date (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return "";
    try {
      return new Date(date).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    context: { isEdit }, // Pass context to yup for password validation
    defaultValues: {
      name: initialData?.name || "",
      username: initialData?.username || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      birthday: formatDateForInput(initialData?.birthday),
      role: initialData?.role || "customer",
      status: initialData?.status || "active",
      password: "",
      address: {
        street: initialData?.address?.street || "",
        city: initialData?.address?.city || "",
        state: initialData?.address?.state || "",
        postalCode: initialData?.address?.postalCode || "",
        country: initialData?.address?.country || "India",
      },
    },
  });

  const [preview, setPreview] = useState(initialData?.profileImage || null);
  const [fileBlob, setFileBlob] = useState(null);

  // Reset form when initialData changes
  useEffect(() => {
    reset({
      name: initialData?.name || "",
      username: initialData?.username || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      birthday: formatDateForInput(initialData?.birthday),
      role: initialData?.role || "customer",
      status: initialData?.status || "active",
      password: "",
      address: {
        street: initialData?.address?.street || "",
        city: initialData?.address?.city || "",
        state: initialData?.address?.state || "",
        postalCode: initialData?.address?.postalCode || "",
        country: initialData?.address?.country || "India",
      },
    });
    setPreview(initialData?.profileImage || null);
    setFileBlob(null);
  }, [initialData, reset]);

  // Image Drop Handler
  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles?.[0]) return;
    const f = acceptedFiles[0];
    setPreview(URL.createObjectURL(f));
    setFileBlob(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const removeImage = () => {
    setPreview(null);
    setFileBlob(null);
  };

  // Submit Handler
  const internalSubmit = async (values) => {
    const fd = new FormData();

    // Append top-level values
    fd.append("name", values.name);
    fd.append("email", values.email);
    fd.append("role", values.role);
    fd.append("status", values.status);
    if (values.username) fd.append("username", values.username);
    if (values.phone) fd.append("phone", values.phone);
    if (values.birthday) fd.append("birthday", values.birthday);
    if (values.password) fd.append("password", values.password);

    // Append nested address fields
    if (values.address) {
      fd.append("address[street]", values.address.street || "");
      fd.append("address[city]", values.address.city || "");
      fd.append("address[state]", values.address.state || "");
      fd.append("address[postalCode]", values.address.postalCode || "");
      fd.append("address[country]", values.address.country || "");
    }

    if (fileBlob) {
      fd.append("image", fileBlob);
    }

    try {
      if (isEdit) {
        await updateUser(initialData._id, fd);
        toast.success("User updated successfully");
      } else {
        await createUser(fd);
        toast.success("User created successfully");
      }
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Operation failed");
    }
  };

  const inner = (
    <Box sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(internalSubmit)} noValidate>
        {/* --- Profile Picture Section --- */}
        <Box sx={{ ...fieldContainerStyles, mb: "24px" }}>
          <Typography sx={sectionHeaderStyles}>
            <CameraAltIcon sx={{ fontSize: 20 }} />
            Profile Picture
          </Typography>
          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed #66BB6A",
              borderRadius: 2,
              backgroundColor: "#F1F8F1",
              p: 2,
              minHeight: "120px !important",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              "& > *": { minHeight: "unset !important" },
              "& [data-dropzone], & .dropzone, & .dz": {
                minHeight: "120px !important",
              },
            }}
          >
            <input {...getInputProps()} />
            {preview ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar
                  src={preview}
                  variant="rounded"
                  sx={{
                    width: 96,
                    height: 96,
                    border: "4px solid #4CAF50",
                    boxShadow: "0 8px 24px rgba(76, 175, 80, 0.20)",
                  }}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CameraAltIcon />}
                    sx={{ ...cancelButtonStyles, px: 2 }}
                  >
                    Change Photo
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    sx={{ px: 2, fontWeight: 600, textTransform: "none" }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.25,
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 34, color: "#ffffff" }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#2E7D32", fontSize: 15 }}
                >
                  {isDragActive ? "Drop image here" : "Upload Profile Picture"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#66BB6A", textAlign: "center", fontSize: 12.5 }}
                >
                  Drag & drop an image here, or click to browse
                  <br />
                  <span style={{ fontSize: 11 }}>
                    Supports: JPG, PNG, GIF (Max 5MB)
                  </span>
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* --- Personal Details Section --- */}
        <Typography sx={sectionHeaderStyles}>
          <PersonIcon sx={{ fontSize: 20 }} />
          Personal Details
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full Name"
                  placeholder="Enter full name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Username"
                  placeholder="e.g. @darshan"
                  fullWidth
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  type="email"
                  placeholder="user@example.com"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone Number"
                  placeholder="+91 99999 99999"
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="birthday"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Birthday"
                  type="date"
                  fullWidth
                  error={!!errors.birthday}
                  helperText={errors.birthday?.message}
                  sx={textFieldStyles}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* --- Address Section --- */}
        <Typography sx={sectionHeaderStyles}>
          <HomeIcon sx={{ fontSize: 20 }} />
          Address
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Controller
              name="address.street"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Street Address"
                  placeholder="123 Main St"
                  fullWidth
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="address.city"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="City"
                  placeholder="Surat"
                  fullWidth
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="address.state"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="State"
                  placeholder="Gujarat"
                  fullWidth
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="address.postalCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Postal Code"
                  placeholder="395001"
                  fullWidth
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="address.country"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Country"
                  placeholder="India"
                  fullWidth
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* --- Access & Security --- */}
        <Typography sx={sectionHeaderStyles}>Access & Security</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              size="medium"
              sx={textFieldStyles}
              error={!!errors.role}
            >
              <InputLabel id="role-label">User Role</InputLabel>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select labelId="role-label" label="User Role" {...field}>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="customer">Customer</MenuItem>
                  </Select>
                )}
              />
              {errors.role && (
                <FormHelperText>{errors.role.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              size="medium"
              sx={textFieldStyles}
              error={!!errors.status}
            >
              <InputLabel id="status-label">Status</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select labelId="status-label" label="Status" {...field}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="blocked">Blocked</MenuItem>
                  </Select>
                )}
              />
              {errors.status && (
                <FormHelperText>{errors.status.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={
                    isEdit
                      ? "Password (Leave blank to keep current)"
                      : "Password *"
                  }
                  type="password"
                  placeholder={
                    isEdit ? "Leave blank to keep current" : "Enter password"
                  }
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={textFieldStyles}
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  const actions = (
    <DialogActions sx={formActionsStyles}>
      <Button
        onClick={onClose}
        variant="outlined"
        startIcon={<CancelIcon />}
        sx={cancelButtonStyles}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit(internalSubmit)}
        variant="contained"
        startIcon={<SaveIcon />}
        sx={submitButtonStyles}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : isEdit ? "Update User" : "Create User"}
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
      onClose={onClose}
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
          <PersonIcon sx={{ fontSize: 28, color: "#fff" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "20px", color: "#fff" }}
          >
            {isEdit ? "Edit User" : "Add New User"}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
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
