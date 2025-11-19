// src/components/Forms/FormAutocomplete.jsx
import React from "react";
import { Controller } from "react-hook-form";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";

export default function FormAutocomplete({
  control,
  name,
  options,
  label,
  loading = false,
  getOptionLabel,
  disabled,
  error,
  helperText,
  ...props
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ref, onBlur } }) => {
        // Find the selected object based on the ID value stored in the form
        const selectedValue =
          options.find((option) => (option._id || option.id) === value) || null;

        return (
          <Autocomplete
            options={options}
            loading={loading}
            disabled={disabled}
            value={selectedValue}
            getOptionLabel={getOptionLabel || ((option) => option.name || "")}
            isOptionEqualToValue={(option, val) =>
              (option._id || option.id) === (val._id || val.id)
            }
            onChange={(_, data) => {
              // Store only the ID in the form state
              onChange(data ? data._id || data.id : "");
            }}
            onBlur={onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                inputRef={ref}
                error={!!error}
                helperText={helperText}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "#fff",
                    "&.Mui-focused fieldset": {
                      borderColor: "#4CAF50",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#2E7D32",
                  },
                }}
              />
            )}
            {...props}
          />
        );
      }}
    />
  );
}
