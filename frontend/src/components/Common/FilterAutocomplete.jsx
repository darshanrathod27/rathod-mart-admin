import React, { useState, useEffect, useMemo } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { useDebounce } from "../../hooks/useDebounce";

/**
 * A standalone Autocomplete component for Filters (outside of forms).
 * Fetches options asynchronously based on user input.
 */
export default function FilterAutocomplete({
  label,
  placeholder,
  fetchOptions, // async function(searchTerm) -> returns array of objects
  value, // The current selected ID
  onChange, // (newValue) -> returns the selected ID (or "")
  getOptionLabel = (option) => option.name || "",
  getOptionValue = (option) => option._id || option.id,
  sx = {},
  minChars = 0,
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Debounce the keystrokes to prevent too many API calls
  const debouncedInput = useDebounce(inputValue, 400);

  // Fetch data when input changes
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        // Pass the search term to the parent's fetcher
        const results = await fetchOptions(debouncedInput);
        if (active) {
          setOptions(results || []);
        }
      } catch (error) {
        console.error("Filter fetch error:", error);
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [debouncedInput, fetchOptions]);

  // Find the full object corresponding to the selected ID 'value'
  // We try to find it in the current options list.
  // Note: For a perfect implementation, you might need to fetch the single selected item
  // if it's not in the current search results, but for filters, this usually works fine
  // or we rely on the parent ensuring the initial list covers it.
  const selectedOption = useMemo(() => {
    return options.find((opt) => getOptionValue(opt) === value) || null;
  }, [options, value, getOptionValue]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={selectedOption}
      onChange={(event, newValue) => {
        onChange(newValue ? getOptionValue(newValue) : "");
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={options}
      loading={loading}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) =>
        getOptionValue(option) === getOptionValue(val)
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
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
            minWidth: 220,
            bgcolor: "white",
            "& .MuiOutlinedInput-root": {
              borderRadius: 12, // Consistent with your theme
            },
            ...sx,
          }}
        />
      )}
    />
  );
}
