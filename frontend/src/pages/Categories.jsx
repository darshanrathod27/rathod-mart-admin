import React, { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
import { getCategoryIcon, getCategoryColor } from "../utils/categoryIcons";
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
  Avatar,
  CircularProgress,
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
import CategoryForm from "../components/Forms/CategoryForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

const Categories = () => {
  const [categories, setCategories] = useState([]);
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
  const [editCategory, setEditCategory] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearchTerm,
        status: filterStatus,
      });
      setCategories(response.data.categories);
      setRowCount(response.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setError("Failed to load categories. Please try again.");
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterStatus]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = () => {
    setEditCategory(null);
    setOpenModal(true);
  };

  const handleEditCategory = (category) => {
    setEditCategory(category);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await categoryService.deleteCategory(categoryId);
        toast.success("Category deleted successfully!");
        fetchCategories();
      } catch (error) {
        const message = error.response?.data?.message || "Delete failed";
        toast.error(message);
      }
    }
    handleMenuClose();
  };

  const handleMenuClick = (event, category) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editCategory) {
        await categoryService.updateCategory(editCategory._id, formData);
        toast.success("Category updated successfully!");
      } else {
        await categoryService.createCategory(formData);
        toast.success("Category added successfully!");
      }
      setOpenModal(false);
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.message || "Operation failed";
      toast.error(message);
    }
  };

  const handleFilter = () => {
    fetchCategories();
    toast.success("Filters applied!");
  };

  const getStatusColor = (status) =>
    status === "Active" ? "success" : "warning";

  const columns = [
    {
      field: "icon",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar
          sx={{
            bgcolor: params.row.color || getCategoryColor(params.row.name),
            width: 40,
            height: 40,
            fontSize: "1.5rem",
          }}
        >
          {params.row.icon || getCategoryIcon(params.row.name)}
        </Avatar>
      ),
    },
    { field: "name", headerName: "Category Name", width: 200 },
    { field: "description", headerName: "Description", width: 300 },
    {
      field: "productsCount",
      headerName: "Products",
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value || 0} size="small" variant="outlined" />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
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
      renderCell: (params) => {
        if (!params.value) {
          return "N/A";
        }
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
        <Button variant="outlined" onClick={fetchCategories}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <TextField
                placeholder="Search categories..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 250 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
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
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddCategory}
              >
                Add Category
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <Box sx={{ height: 631, width: "100%" }}>
            <DataGrid
              rows={categories}
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
          </Box>
        </Card>
      </motion.div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditCategory(selectedCategory)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteCategory(selectedCategory?._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editCategory ? "Edit Category" : "Add New Category"}
      >
        <CategoryForm
          initialData={editCategory}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default Categories;
