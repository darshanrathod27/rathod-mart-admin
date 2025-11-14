// frontend/src/pages/PromocodeMaster.jsx
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
  Alert,
  FormControl,
  InputLabel,
  Select,
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
  LocalOffer,
} from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import PromocodeForm from "../components/Forms/PromocodeForm"; // Import the new form
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { promocodeService } from "../services/promocodeService"; // Import the new service

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtCurrency = (n) => (n ? `₹${Number(n).toLocaleString("en-IN")}` : "—");
const fmtPercentage = (n) => (n ? `${n}%` : "—");

const PromocodeMaster = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await promocodeService.getPromocodes({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch,
        status: filterStatus,
      });
      setRows(Array.isArray(res?.data) ? res.data : []);
      setRowCount(res?.pagination?.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load data. Please try again.");
      toast.error(err.message || "Failed to fetch promocodes");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    setOpenModal(true);
  };
  const handleEdit = (row) => {
    setEditItem(row);
    setOpenModal(true);
    handleMenuClose();
  };
  const handleMenuClick = (e, row) => {
    setAnchorEl(e.currentTarget);
    setSelectedRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };
  const handleFilter = () => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await promocodeService.updatePromocode(editItem._id, formData);
        toast.success("Promocode updated");
      } else {
        await promocodeService.createPromocode(formData);
        toast.success("Promocode created");
      }
      setOpenModal(false);
      setEditItem(null);
      fetchData();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Operation failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this promocode?"))
      return;
    try {
      await promocodeService.deletePromocode(id);
      toast.success("Promocode deleted");
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Delete failed");
    }
    handleMenuClose();
  };

  const columns = [
    {
      field: "code",
      headerName: "Code",
      width: 160,
      renderCell: (p) => (
        <Chip
          icon={<LocalOffer />}
          label={p.value}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700, fontFamily: "monospace" }}
        />
      ),
    },
    {
      field: "discountType",
      headerName: "Discount",
      width: 150,
      renderCell: (p) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {p.row.discountType === "Percentage"
              ? fmtPercentage(p.row.discountValue)
              : fmtCurrency(p.row.discountValue)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {p.row.discountType}
          </Typography>
        </Box>
      ),
    },
    {
      field: "minPurchase",
      headerName: "Min Purchase",
      width: 130,
      renderCell: (p) => fmtCurrency(p.value),
    },
    {
      field: "maxDiscount",
      headerName: "Max Discount",
      width: 130,
      renderCell: (p) => fmtCurrency(p.value),
    },
    {
      // FIX: Changed field to 'useCount' to match backend model
      field: "useCount",
      headerName: "Uses (Used/Max)",
      width: 140,
      renderCell: (p) => (
        <Typography variant="body2">
          {p.value || 0}
          {p.row.maxUses ? ` / ${p.row.maxUses}` : ""}
        </Typography>
      ),
    },
    {
      field: "expiresAt",
      headerName: "Expires",
      width: 140,
      renderCell: (p) => fmtDate(p.value),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => (
        <Chip
          label={p.value}
          color={p.value === "Active" ? "success" : "default"}
          size="small"
        />
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchData} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Search by code..."
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
              size="small"
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
            <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
              Add Promocode
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          rowCount={rowCount}
          pageSizeOptions={[10, 20, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "rgba(76, 175, 80, 0.05)",
            },
          }}
        />
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(selectedRow)}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDelete(selectedRow?._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {openModal && (
        <FormModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setEditItem(null);
          }}
          title={editItem ? "Edit Promocode" : "Add New Promocode"}
          maxWidth="md"
        >
          <PromocodeForm
            initialData={editItem}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setOpenModal(false);
              setEditItem(null);
            }}
            submitting={submitting}
          />
        </FormModal>
      )}
    </Box>
  );
};

export default PromocodeMaster;
