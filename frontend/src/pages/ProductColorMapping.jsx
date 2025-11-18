// src/pages/ProductColorMapping.jsx
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
  Circle,
} from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import ProductColorMappingForm from "../components/Forms/ProductColorMappingForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { productColorMappingService } from "../services/productColorMappingService";
import { productService } from "../services/productService";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const ProductColorMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProduct, setFilterProduct] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [openModal, setOpenModal] = useState(false);
  const [editMapping, setEditMapping] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMapping, setSelectedMapping] = useState(null);

  const fetchMappings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { mappings, pagination } =
        await productColorMappingService.getColorMappings({
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          search: debouncedSearchTerm,
          status: filterStatus,
          product: filterProduct,
        });
      setMappings(Array.isArray(mappings) ? mappings : []);
      setRowCount(pagination?.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load mappings. Please try again.");
      toast.error(err.message || "Failed to fetch color mappings");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterStatus, filterProduct]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts({
          limit: 1000,
          status: "active",
        });
        let list = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.products)) list = res.data.products;
        else if (Array.isArray(res?.products)) list = res.products;
        else if (Array.isArray(res)) list = res;
        setProducts(list || []);
      } catch {
        toast.error("Could not load products for filter.");
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleAddMapping = () => {
    setEditMapping(null);
    setOpenModal(true);
  };
  const handleEditMapping = (row) => {
    setEditMapping(row);
    setOpenModal(true);
    handleMenuClose();
  };
  const handleMenuClick = (e, row) => {
    setAnchorEl(e.currentTarget);
    setSelectedMapping(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMapping(null);
  };
  const applyFilter = () => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchMappings();
    toast.success("Filters applied!");
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editMapping) {
        await productColorMappingService.updateColorMapping(
          editMapping._id,
          formData
        );
        toast.success("Mapping updated successfully!");
      } else {
        await productColorMappingService.createColorMapping(formData);
        toast.success("Mapping added successfully!");
      }
      setOpenModal(false);
      setEditMapping(null);
      await fetchMappings();
    } catch (e) {
      toast.error(e.message || "Operation failed");
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this mapping?"))
      return;
    try {
      await productColorMappingService.deleteColorMapping(id);
      toast.success("Mapping deleted successfully!");
      await fetchMappings();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
    handleMenuClose();
  };

  const columns = [
    {
      field: "productName",
      headerName: "Product Name",
      width: 260,
      sortable: false,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p?.row?.product?.name || p?.row?.productName || "N/A"}
        </Typography>
      ),
    },
    { field: "colorName", headerName: "Color Name", width: 160 },
    {
      field: "value",
      headerName: "Color",
      width: 170,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Circle sx={{ color: p?.row?.value, fontSize: 22 }} />
          <Typography variant="body2">{p?.row?.value || "-"}</Typography>
        </Box>
      ),
    },
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
        <Button onClick={fetchMappings} sx={{ mt: 2 }}>
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
              placeholder="Search by color name..."
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
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter By Product</InputLabel>
              <Select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                label="Filter By Product"
              >
                <MenuItem value="">
                  <em>All Products</em>
                </MenuItem>
                {(products || []).map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              onClick={applyFilter}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddMapping}
            >
              Add Mapping
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={Array.isArray(mappings) ? mappings : []}
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
        <MenuItem onClick={() => handleEditMapping(selectedMapping)}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteMapping(selectedMapping?._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <FormModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditMapping(null);
        }}
        title={editMapping ? "Edit Color Mapping" : "Add New Color Mapping"}
      >
        <ProductColorMappingForm
          initialData={editMapping}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setOpenModal(false);
            setEditMapping(null);
          }}
        />
      </FormModal>
    </Box>
  );
};

export default ProductColorMapping;
