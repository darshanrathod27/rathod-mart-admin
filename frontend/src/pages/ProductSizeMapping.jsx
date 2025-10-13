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
import ProductSizeMappingForm from "../components/Forms/ProductSizeMappingForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { productSizeMappingService } from "../services/productSizeMappingService";
import { productService } from "../services/productService";

const ProductSizeMapping = () => {
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
      const response = await productSizeMappingService.getSizeMappings({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearchTerm,
        status: filterStatus,
        product: filterProduct,
      });
      setMappings(response.data.mappings);
      setRowCount(response.data.pagination.total);
    } catch (error) {
      setError("Failed to load mappings. Please try again.");
      toast.error("Failed to fetch size mappings");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterStatus, filterProduct]);

  useEffect(() => {
    const fetchProductsForFilter = async () => {
      try {
        const res = await productService.getProducts({ limit: 500 });
        setProducts(res.data.products);
      } catch (err) {
        toast.error("Could not load products for filter.");
      }
    };
    fetchProductsForFilter();
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

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
  const handleFilter = () => {
    fetchMappings();
    toast.success("Filters applied!");
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
      fetchMappings();
    } catch (error) {
      const message = error.response?.data?.message || "Operation failed";
      toast.error(message);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (window.confirm("Are you sure you want to delete this mapping?")) {
      try {
        await productSizeMappingService.deleteSizeMapping(mappingId);
        toast.success("Mapping deleted successfully!");
        fetchMappings();
      } catch (error) {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
    handleMenuClose();
  };

  const columns = [
    {
      field: "product",
      headerName: "Product Name",
      width: 250,
      valueGetter: (value, row) => row.product?.name || "N/A",
    },
    { field: "sizeName", headerName: "Size Name", width: 150 },
    { field: "value", headerName: "Size Value", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Active" ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 120,
      type: "date",
      valueGetter: (value) => value && new Date(value),
      renderCell: (params) =>
        new Date(params.value).toLocaleDateString("en-IN"),
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

  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchMappings} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );

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
              placeholder="Search by size name..."
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
                {products.map((p) => (
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
              onClick={handleFilter}
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
          rows={mappings}
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
        onClose={() => setOpenModal(false)}
        title={editMapping ? "Edit Size Mapping" : "Add New Size Mapping"}
      >
        <ProductSizeMappingForm
          initialData={editMapping}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default ProductSizeMapping;
