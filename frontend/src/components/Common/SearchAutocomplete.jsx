// frontend/src/components/Common/SearchAutocomplete.jsx
import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";
import { useDebounce } from "../../hooks/useDebounce";

const SearchAutocomplete = ({
  placeholder = "Search...",
  onSelect,
  fetchSuggestions, // async function returning array of strings/objects
  value,
}) => {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const debouncedInput = useDebounce(inputValue, 400);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (debouncedInput === "") {
      setOptions(value ? [value] : []);
      return;
    }

    setLoading(true);
    fetchSuggestions(debouncedInput).then((results) => {
      if (active) {
        setOptions(results || []);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [debouncedInput, fetchSuggestions, value]);

  return (
    <Autocomplete
      freeSolo
      disablePortal
      options={options}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.name || ""
      }
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
        // Also trigger callback for manual typing
        if (typeof onSelect === "function") onSelect(newInputValue);
      }}
      onChange={(event, newValue) => {
        if (typeof onSelect === "function") onSelect(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          size="small"
          fullWidth
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 50,
              bgcolor: "white",
              "& fieldset": { borderColor: "#E0E0E0" },
              "&:hover fieldset": { borderColor: "#4CAF50" },
              "&.Mui-focused fieldset": { borderColor: "#2E7D32" },
            },
          }}
        />
      )}
    />
  );
};

export default SearchAutocomplete;
