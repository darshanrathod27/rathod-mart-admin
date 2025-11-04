import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import FormModal from "../components/Modals/FormModal";
import VariantMasterForm from "../components/Forms/VariantMasterForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { variantMasterService } from "../services/variantMasterService";

const VariantMaster = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [openModal, setOpenModal] = useState(false);
  const [editVariant, setEditVariant] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await variantMasterService.getVariants({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearchTerm,
        status: filterStatus,
      });
      // This is correct: response.data.variants
      setVariants(response.data.variants);
      // This is correct: response.data.pagination.total
      setRowCount(response.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      setError("Failed to load variants. Please try again.");
      toast.error("Failed to fetch variants");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterStatus]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const handleAddVariant = () => {
    setEditVariant(null);
    setOpenModal(true);
  };

  const handleEditVariant = (variant) => {
    setEditVariant(variant);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleDeleteVariant = async (variantId) => {
    if (window.confirm("Are you sure you want to delete this variant?")) {
      try {
        await variantMasterService.deleteVariant(variantId);
        toast.success("Variant deleted successfully!");
        fetchVariants();
      } catch (error) {
        const message = error.response?.data?.message || "Delete failed";
        toast.error(message);
      }
    }
    handleMenuClose();
  };

  const handleMenuClick = (event, variant) => {
    setAnchorEl(event.currentTarget);
    setSelectedVariant(variant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVariant(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editVariant) {
        await variantMasterService.updateVariant(editVariant._id, formData);
        toast.success("Variant updated successfully!");
      } else {
        await variantMasterService.createVariant(formData);
        toast.success("Variant added successfully!");
      }
      setOpenModal(false);
      fetchVariants();
    } catch (error) {
      const message = error.response?.data?.message || "Operation failed";
      toast.error(message);
    }
  };

  const handleFilter = () => {
    fetchVariants();
    toast.success("Filters applied!");
  };

  const columns = [
    {
      field: "product",
      headerName: "Product Name",
      width: 200,
      valueGetter: (params) => params.row.product?.name || "N/A",
    },
    {
      field: "size",
      headerName: "Size",
      width: 120,
      valueGetter: (params) => params.row.size?.sizeName || "N/A",
    },
    {
      field: "color",
      headerName: "Color",
      width: 120,
      valueGetter: (params) => params.row.color?.colorName || "N/A",
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (params) => `₹${params.value || 0}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Active" ? "success" : "warning"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 120,
      type: "date",
      valueGetter: (params) => params.value && new Date(params.value),
      renderCell: (params) => {
        if (!params.value) return "N/A";
        return new Date(params.value).toLocaleDateString("en-IN");
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleMenuClick(e, params.row)}
          size="small"
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" color="primary" onClick={fetchVariants}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              fontWeight: 700,
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Variant Master
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Search variants..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={handleFilter}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddVariant}
              sx={{
                background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
              }}
            >
              Add Variant
            </Button>
          </Box>

          <DataGrid
            rows={variants}
            columns={columns}
            getRowId={(row) => row._id}
            loading={loading}
            rowCount={rowCount}
            pageSizeOptions={[10, 20, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "rgba(76, 175, 80, 0.05)",
              },
            }}
          />
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditVariant(selectedVariant)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteVariant(selectedVariant?._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editVariant ? "Edit Variant" : "Add New Variant"}
      >
        <VariantMasterForm
          initialData={editVariant}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default VariantMaster;
