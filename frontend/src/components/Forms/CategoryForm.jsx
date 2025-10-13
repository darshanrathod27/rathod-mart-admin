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
  Typography,
  Paper,
} from "@mui/material";
import { Save, Cancel, Category as CategoryIcon } from "@mui/icons-material";
import { motion } from "framer-motion";

const categorySchema = yup.object({
  name: yup
    .string()
    .required("Category Name is required")
    .min(2, "Name must be at least 2 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(5, "Description must be at least 5 characters"),
  status: yup.string().required("Status is required"),
});

const CategoryForm = ({ initialData, onSubmit, onCancel }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      status: "Active",
    },
  });

  const formFields = [
    {
      name: "name",
      label: "Category Name",
      placeholder: "e.g., Electronics, Fashion",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Brief description of the category",
      multiline: true,
      rows: 3,
    },
  ];

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
                    label={field.label}
                    placeholder={field.placeholder}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]?.message}
                    multiline={field.multiline}
                    rows={field.rows}
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
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <FormControl fullWidth error={!!errors.status}>
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
              {errors.status && (
                <FormHelperText>{errors.status.message}</FormHelperText>
              )}
            </FormControl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
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
                {initialData ? "Update" : "Create"}
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default CategoryForm;
