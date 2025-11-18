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
import FormModal from "../components/Modals/FormModal";
import VariantManager from "../components/Forms/VariantMasterForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { variantMasterService } from "../services/variantMasterService";

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
      const { variants: vList, pagination } =
        await variantMasterService.getVariants({
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          search: debouncedSearchTerm,
          status: filterStatus,
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
  }, [paginationModel, debouncedSearchTerm, filterStatus]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

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

  const handleDeleteVariant = async (id) => {
    if (!window.confirm("Delete variant?")) return;
    try {
      await variantMasterService.deleteVariant(id);
      toast.success("Variant deleted");
      fetchVariants();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

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
      width: 140,
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
      width: 140,
      sortable: false,
      renderCell: (p) => (
        <Typography variant="body2">
          {p?.row?.color?.colorName || p?.row?.colorName || "N/A"}
        </Typography>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (p) => {
        const v = p?.row?.price ?? p?.row?.sellingPrice ?? p?.row?.mrp ?? 0;
        return (
          <Typography variant="body2">
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
      filterable: false,
      renderCell: (p) => (
        <IconButton
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
            setSelectedVariant(p.row);
          }}
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
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchVariants} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              placeholder="Search..."
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
              onClick={fetchVariants}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditVariant(null);
                setOpenModal(true);
              }}
            >
              Add Variant
            </Button>
          </Box>
        </CardContent>
      </Card>

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
        />
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setEditVariant(selectedVariant);
            setOpenModal(true);
            setAnchorEl(null);
          }}
        >
          <Edit style={{ marginRight: 8 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteVariant(selectedVariant?._id);
            setAnchorEl(null);
          }}
          sx={{ color: "error.main" }}
        >
          <Delete style={{ marginRight: 8 }} /> Delete
        </MenuItem>
      </Menu>

      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editVariant ? "Edit Variant" : "Add Variant(s)"}
      >
        <VariantManager
          initialData={editVariant}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default VariantMaster;
