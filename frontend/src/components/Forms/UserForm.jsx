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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/CloseOutlined";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PersonIcon from "@mui/icons-material/Person";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useForm, Controller } from "react-hook-form";
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

export default function UserForm({
  open = true,
  initialData,
  onSubmit,
  onClose,
  embedded = false,
}) {
  const isEdit = Boolean(initialData);
  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "customer",
      status: initialData?.status || "active",
      password: "",
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "customer",
      status: initialData?.status || "active",
      password: "",
    });
    if (initialData?.profileImage) setPreview(initialData.profileImage);
  }, [initialData, reset]);

  const [preview, setPreview] = useState(initialData?.profileImage || null);
  const [fileBlob, setFileBlob] = useState(null);

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

  const internalSubmit = (values) => {
    onSubmit?.({ ...values, file: fileBlob || null });
  };

  const inner = (
    <Box sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(internalSubmit)}>
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

        <Box sx={fieldContainerStyles}>
          <TextField
            label="Full Name"
            placeholder="Enter full name"
            {...register("name")}
            fullWidth
            sx={textFieldStyles}
          />
        </Box>

        <Box sx={fieldContainerStyles}>
          <TextField
            label="Email Address"
            type="email"
            placeholder="user@example.com"
            {...register("email")}
            fullWidth
            sx={textFieldStyles}
          />
        </Box>

        <Box sx={fieldContainerStyles}>
          <TextField
            label="Phone Number"
            placeholder="+91 99999 99999"
            {...register("phone")}
            fullWidth
            sx={textFieldStyles}
          />
        </Box>

        <Box sx={fieldContainerStyles}>
          <FormControl fullWidth size="medium" sx={textFieldStyles}>
            <InputLabel id="role-label">User Role</InputLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select labelId="role-label" label="User Role" {...field}>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                </Select>
              )}
            />
          </FormControl>
        </Box>

        <Box sx={fieldContainerStyles}>
          <FormControl fullWidth size="medium" sx={textFieldStyles}>
            <InputLabel id="status-label">Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select labelId="status-label" label="Status" {...field}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              )}
            />
          </FormControl>
        </Box>

        <Box sx={fieldContainerStyles}>
          <TextField
            label={
              isEdit ? "Password (Leave blank to keep current)" : "Password"
            }
            type="password"
            placeholder={
              isEdit ? "Leave blank to keep current" : "Enter password"
            }
            {...register("password")}
            fullWidth
            sx={textFieldStyles}
          />
        </Box>
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
      >
        {isEdit ? "Update User" : "Create User"}
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
