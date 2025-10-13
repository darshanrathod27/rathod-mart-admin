import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Phone,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useState } from "react";

const userSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format"),
  // FIXED: Added phone validation
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"),
  password: yup.string().when("$isEdit", {
    is: false,
    then: (schema) =>
      schema
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    otherwise: (schema) => schema.notRequired(),
  }),
  role: yup.string().required("Role is required"),
  status: yup.string().required("Status is required"),
});

const UserForm = ({ initialData, onSubmit, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(userSchema),
    context: { isEdit: !!initialData },
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "", // FIXED: Added default value
      password: "",
      role: "Customer", // Changed default to Customer
      status: "Active",
    },
  });

  const formFields = [
    {
      name: "name",
      label: "Full Name",
      placeholder: "e.g., John Doe",
      type: "text",
    },
    {
      name: "email",
      label: "Email Address",
      placeholder: "e.g., john@example.com",
      type: "email",
    },
    // FIXED: Added phone field to the form
    {
      name: "phone",
      label: "Phone Number",
      placeholder: "e.g., 9876543210",
      type: "tel",
      icon: <Phone color="primary" />,
    },
  ];

  if (!initialData) {
    formFields.push({
      name: "password",
      label: "Password",
      placeholder: "Enter password (min 6 characters)",
      type: "password",
    });
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {formFields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  <TextField
                    {...controllerField}
                    fullWidth
                    type={
                      field.type === "password" && !showPassword
                        ? "password"
                        : "text"
                    }
                    label={`${field.label} *`}
                    placeholder={field.placeholder}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]?.message}
                    InputProps={{
                      startAdornment: field.icon && (
                        <InputAdornment position="start">
                          {field.icon}
                        </InputAdornment>
                      ),
                      endAdornment:
                        field.type === "password" ? (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ) : undefined,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": { borderColor: "primary.main" },
                        "&.Mui-focused fieldset": {
                          borderColor: "primary.main",
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                )}
              />
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: formFields.length * 0.1 }}
          >
            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Role *</InputLabel>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Role *">
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Customer">Customer</MenuItem>
                    <MenuItem value="Vendor">Vendor</MenuItem>
                  </Select>
                )}
              />
              {errors.role && (
                <FormHelperText>{errors.role.message}</FormHelperText>
              )}
            </FormControl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: (formFields.length + 1) * 0.1,
            }}
          >
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Status *</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Status *">
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                )}
              />
              {errors.status && (
                <FormHelperText>{errors.status.message}</FormHelperText>
              )}
            </FormControl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: (formFields.length + 2) * 0.1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                pt: 2,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={onCancel}
                sx={{ minWidth: 120 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                sx={{
                  minWidth: 120,
                  background:
                    "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                }}
              >
                {initialData ? "Update User" : "Create User"}
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default UserForm;
