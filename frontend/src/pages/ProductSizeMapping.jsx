// frontend/src/pages/ProductSizeMapping.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Clear,
  Warning,
} from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import ProductSizeMappingForm from "../components/Forms/ProductSizeMappingForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { productSizeMappingService } from "../services/productSizeMappingService";
import { productService } from "../services/productService";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// --- Delete Confirmation Component ---
const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemName }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Warning color="error" /> Confirm Deletion
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete size mapping for{" "}
        <strong>{itemName}</strong>? This action cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} variant="outlined" color="inherit">
        Cancel
      </Button>
      <Button onClick={onConfirm} variant="contained" color="error">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const ProductSizeMapping = () => {
  // Data State
  const [mappings, setMappings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  // Pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProduct, setFilterProduct] = useState(null);

  // Modals & Dialogs
  const [openModal, setOpenModal] = useState(false);
  const [editMapping, setEditMapping] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState(null);

  // Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMapping, setSelectedMapping] = useState(null);

  // Fetch Products for Filter (using Autocomplete)
  useEffect(() => {
    const fetchProductsForFilter = async () => {
      try {
        // Getting all active/draft products for filter dropdown
        const res = await productService.getProducts({ limit: 1000 });
        const list = Array.isArray(res?.data) ? res.data : res || [];
        setProducts(list);
      } catch (err) {
        console.error("Product fetch error:", err);
      }
    };
    fetchProductsForFilter();
  }, []);

  // Fetch Mappings (with search & filter)
  const fetchMappings = useCallback(async () => {
    try {
      setLoading(true);
      const { mappings, pagination } =
        await productSizeMappingService.getSizeMappings({
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          search: debouncedSearchTerm,
          status: filterStatus,
          // Use ID if filterProduct is selected
          product: filterProduct ? filterProduct._id || filterProduct.id : "",
        });
      setMappings(Array.isArray(mappings) ? mappings : []);
      setRowCount(pagination?.total || 0);
    } catch (err) {
      toast.error("Failed to fetch size mappings");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterStatus, filterProduct]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  // Handlers
  const handleAddMapping = () => {
    setEditMapping(null);
    setOpenModal(true);
  };

  const handleEditMapping = (mapping) => {
    setEditMapping(mapping);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleMenuClick = (event, mapping) => {
    setAnchorEl(event.currentTarget);
    setSelectedMapping(mapping);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMapping(null);
  };

  const confirmDelete = (mapping) => {
    setMappingToDelete(mapping);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteMapping = async () => {
    if (!mappingToDelete) return;
    try {
      await productSizeMappingService.deleteSizeMapping(mappingToDelete._id);
      toast.success("Mapping deleted successfully!");
      await fetchMappings();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    } finally {
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editMapping) {
        await productSizeMappingService.updateSizeMapping(
          editMapping._id,
          formData
        );
        toast.success("Mapping updated successfully!");
      } else {
        await productSizeMappingService.createSizeMapping(formData);
        toast.success("Mapping added successfully!");
      }
      setOpenModal(false);
      setEditMapping(null);
      await fetchMappings();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  };

  const columns = [
    {
      field: "productName",
      headerName: "Product Name",
      flex: 1,
      minWidth: 220,
      sortable: false,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p?.row?.product?.name || p?.row?.productName || "N/A"}
        </Typography>
      ),
    },
    { field: "sizeName", headerName: "Size Name", width: 150 },
    { field: "value", headerName: "Size Value", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => (
        <Chip
          label={p?.row?.status || "Inactive"}
          color={
            (p?.row?.status || "").toLowerCase() === "active"
              ? "success"
              : "default"
          }
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      renderCell: (p) => (
        <Typography variant="caption">
          {fmtDate(p?.row?.createdAt || p?.row?.updatedAt)}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      renderCell: (p) => (
        <IconButton onClick={(e) => handleMenuClick(e, p.row)} size="small">
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* --- Header: Single Row --- */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Search (Now searches Product Name too) */}
            <TextField
              placeholder="Search size or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 240 }}
              size="small"
            />

            {/* Filter: Product (Autocomplete) */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 220 }}
              options={products}
              getOptionLabel={(option) => option.name || ""}
              value={filterProduct}
              onChange={(event, newValue) => setFilterProduct(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter By Product"
                  placeholder="Select product"
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
            />

            {/* Filter: Status */}
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

            {/* Add Button */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddMapping}
              sx={{ whiteSpace: "nowrap", height: 40 }}
            >
              Add Mapping
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* --- Data Table --- */}
      <Card>
        <DataGrid
          rows={mappings}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          rowCount={rowCount}
          pageSizeOptions={[10, 20, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "rgba(76, 175, 80, 0.05)",
            },
          }}
        />
      </Card>

      {/* --- Menus & Modals --- */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditMapping(selectedMapping)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => confirmDelete(selectedMapping)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete
        </MenuItem>
      </Menu>

      <FormModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditMapping(null);
        }}
        title={editMapping ? "Edit Size Mapping" : "Add New Size Mapping"}
      >
        <ProductSizeMappingForm
          initialData={editMapping}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setOpenModal(false);
            setEditMapping(null);
          }}
        />
      </FormModal>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteMapping}
        itemName={
          mappingToDelete
            ? `${mappingToDelete.sizeName} (${mappingToDelete.product?.name})`
            : ""
        }
      />
    </Box>
  );
};

export default ProductSizeMapping;
