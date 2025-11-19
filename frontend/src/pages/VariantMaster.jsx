// src/pages/VariantMaster.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
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
  Button,
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
import VariantMasterForm from "../components/Forms/VariantMasterForm"; // Ensure correct import name
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { variantMasterService } from "../services/variantMasterService";
import { productService } from "../services/productService";

const fmtDate = (d) => {
  const date = d || null;
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

// --- Delete Confirmation Component ---
const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemName }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Warning color="error" /> Confirm Deletion
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete this variant <strong>{itemName}</strong>
        ? This action cannot be undone.
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

const VariantMaster = () => {
  // Data
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProduct, setFilterProduct] = useState(null); // For Autocomplete
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Modals
  const [openModal, setOpenModal] = useState(false);
  const [editVariant, setEditVariant] = useState(null);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);

  // Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // --- Fetch Variants ---
  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { variants: vList, pagination } =
        await variantMasterService.getVariants({
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          search: debouncedSearchTerm,
          status: filterStatus,
          product: filterProduct ? filterProduct._id || filterProduct.id : "",
        });
      setVariants(Array.isArray(vList) ? vList : []);
      setRowCount(pagination?.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch variants");
      toast.error(err.message || "Failed to fetch variants");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterStatus, filterProduct]);

  // --- Fetch Products for Filter ---
  useEffect(() => {
    const fetchProductsList = async () => {
      try {
        const res = await productService.getProducts({ limit: 1000 });
        const list = Array.isArray(res?.data) ? res.data : res || [];
        setProducts(list);
      } catch (err) {
        console.error("Product fetch error", err);
      }
    };
    fetchProductsList();
  }, []);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // --- Handlers ---
  const handleAdd = () => {
    setEditVariant(null);
    setOpenModal(true);
  };

  const handleEdit = (variant) => {
    setEditVariant(variant);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleMenuClick = (e, row) => {
    setAnchorEl(e.currentTarget);
    setSelectedVariant(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVariant(null);
  };

  const confirmDelete = (variant) => {
    setVariantToDelete(variant);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteVariant = async () => {
    if (!variantToDelete) return;
    try {
      await variantMasterService.deleteVariant(variantToDelete._id);
      toast.success("Variant deleted");
      fetchVariants();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleteDialogOpen(false);
      setVariantToDelete(null);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editVariant) {
        await variantMasterService.updateVariant(editVariant._id, data);
        toast.success("Variant updated");
      } else {
        await variantMasterService.createVariant(data);
        toast.success("Variant(s) created");
      }
      setOpenModal(false);
      setEditVariant(null);
      fetchVariants();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  // --- Columns ---
  const columns = [
    {
      field: "productName",
      headerName: "Product",
      flex: 1,
      minWidth: 220,
      sortable: false,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p?.row?.product?.name || p?.row?.productName || "N/A"}
        </Typography>
      ),
    },
    {
      field: "sizeName",
      headerName: "Size",
      width: 130,
      sortable: false,
      renderCell: (p) => (
        <Typography variant="body2">
          {p?.row?.size?.sizeName || p?.row?.sizeName || "N/A"}
        </Typography>
      ),
    },
    {
      field: "colorName",
      headerName: "Color",
      width: 130,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            {p?.row?.color?.colorName || p?.row?.colorName || "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (p) => {
        const v = p?.row?.price ?? p?.row?.sellingPrice ?? p?.row?.mrp ?? 0;
        return (
          <Typography variant="body2" fontWeight={600}>
            ₹{Number(v).toLocaleString("en-IN")}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => (
        <Chip
          label={p?.row?.status || "Inactive"}
          size="small"
          color={
            (p?.row?.status || "").toLowerCase() === "active"
              ? "success"
              : "default"
          }
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 140,
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
      filterable: false,
      renderCell: (p) => (
        <IconButton onClick={(e) => handleMenuClick(e, p.row)} size="small">
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchVariants} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

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
            {/* Search */}
            <TextField
              placeholder="Search product, sku, size..."
              size="small"
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
              onClick={handleAdd}
              sx={{ whiteSpace: "nowrap", height: 40 }}
            >
              Add Variant
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* --- Data Table --- */}
      <Card>
        <DataGrid
          rows={Array.isArray(variants) ? variants : []}
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

      {/* --- Menu & Modals --- */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(selectedVariant)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => confirmDelete(selectedVariant)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete
        </MenuItem>
      </Menu>

      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editVariant ? "Edit Variant" : "Add Variant(s)"}
      >
        <VariantMasterForm
          initialData={editVariant}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteVariant}
        itemName={
          variantToDelete
            ? `${variantToDelete.product?.name || "Product"}`
            : "Item"
        }
      />
    </Box>
  );
};

export default VariantMaster;
