// frontend/src/pages/Categories.jsx

import React, { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  AutoFixHigh,
  FilterList,
  Clear,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import FormModal from "../components/Modals/FormModal";
import CategoryForm from "../components/Forms/CategoryForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

const Categories = () => {
  // Table data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  // Server pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // ✅ ADVANCED SEARCH - Searches name and description
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortModel, setSortModel] = useState([
    { field: "createdAt", sort: "desc" },
  ]);

  // Modal/Menu state
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // ✅ Fix Icons Feature
  const handleFixIcons = async () => {
    if (
      !window.confirm(
        "This will update all existing category icons and colors. Continue?"
      )
    )
      return;

    try {
      const res = await categoryService.fixCategoryIcons();
      toast.success(res?.message || "Icons fixed successfully!");
      fetchData();
    } catch (e) {
      console.error("Fix icons error:", e);
      const errMsg =
        e?.message || e?.response?.data?.message || "Failed to fix icons";
      toast.error(errMsg);
    }
  };

  // ✅ Fetch Categories with Advanced Search
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch, // ✅ Searches name and description
        status: filterStatus,
        sortBy: sortModel[0]?.field || "createdAt",
        sortOrder: sortModel[0]?.sort || "desc",
      };

      const res = await categoryService.getCategories(params);

      setRows(Array.isArray(res?.data) ? res.data : []);
      setRowCount(res?.pagination?.total || 0);
    } catch (e) {
      console.error("Fetch categories error:", e);
      const errMsg =
        e?.message ||
        e?.response?.data?.message ||
        "Failed to fetch categories";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch, filterStatus, sortModel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Clear All Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setPaginationModel({ page: 0, pageSize: 10 });
  };

  const handleAdd = () => {
    setEditItem(null);
    setOpenModal(true);
  };

  const handleMenuClick = (e, row) => {
    setAnchorEl(e.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleEdit = (row) => {
    setEditItem(row);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? This action cannot be undone."))
      return;

    try {
      await categoryService.deleteCategory(id);
      toast.success("Category deleted successfully");
      fetchData();
    } catch (e) {
      console.error("Delete error:", e);
      const errMsg =
        e?.message || e?.response?.data?.message || "Delete failed";
      toast.error(errMsg);
    }
    handleMenuClose();
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editItem) {
        await categoryService.updateCategory(editItem._id, formData);
        toast.success("Category updated successfully");
      } else {
        await categoryService.createCategory(formData);
        toast.success("Category created successfully");
      }
      setOpenModal(false);
      fetchData();
    } catch (e) {
      console.error("Save error:", e);
      const errMsg = e?.message || e?.response?.data?.message || "Save failed";
      toast.error(errMsg);
    }
  };

  // Status color helper
  const statusColor = (s) =>
    String(s).toLowerCase() === "active" ? "success" : "warning";

  // ✅ DataGrid Columns
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
            bgcolor: params.row.color || "#1976d2",
            width: 40,
            height: 40,
          }}
        >
          {params.row.icon || "✨"}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Category Name",
      width: 220,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      width: 320,
      renderCell: (p) => (
        <Typography variant="caption" color="text.secondary" noWrap>
          {p.value || "—"}
        </Typography>
      ),
    },
    {
      field: "productsCount",
      headerName: "Products",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Chip
          label={p.value || 0}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => (
        <Chip
          label={p.value}
          color={statusColor(p.value)}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 140,
      renderCell: (params) => {
        const date = params.row.createdAt;
        if (!date) return <Typography variant="caption">—</Typography>;
        try {
          return (
            <Typography variant="caption">
              {new Date(date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Typography>
          );
        } catch {
          return <Typography variant="caption">—</Typography>;
        }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Categories Management
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<AutoFixHigh />}
              onClick={handleFixIcons}
            >
              Fix Icons
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
              Add Category
            </Button>
          </Stack>
        </Box>

        {/* Search and Filters Card */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Search Bar - Searches name and description */}
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  placeholder="Search by name or description..."
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm("")}
                        >
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flexGrow: 1, minWidth: 260 }}
                />

                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                >
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </Stack>

              {/* Clear Filters Button */}
              {(searchTerm || filterStatus) && (
                <Button
                  variant="text"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  size="small"
                  sx={{ alignSelf: "flex-start" }}
                >
                  Clear All Filters
                </Button>
              )}

              {/* Filter Options */}
              {showFilters && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* DataGrid Card */}
        <Card>
          <Box sx={{ width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row._id}
              rowCount={rowCount}
              loading={loading}
              pagination
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 20, 50]}
              sortingMode="server"
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              disableRowSelectionOnClick
              autoHeight
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "rgba(76, 175, 80, 0.05)",
                },
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            />
          </Box>
        </Card>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleEdit(selectedRow)}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => selectedRow && handleDelete(selectedRow._id)}
            sx={{ color: "error.main" }}
          >
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>

        {/* Category Form Modal */}
        <FormModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          title={editItem ? "Edit Category" : "Add New Category"}
        >
          <CategoryForm
            category={editItem}
            onSuccess={handleFormSubmit}
            onCancel={() => setOpenModal(false)}
          />
        </FormModal>
      </Box>
    </motion.div>
  );
};

export default Categories;
