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
  Alert,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Search, MoreVert, Edit, Delete } from "@mui/icons-material";
import { motion } from "framer-motion";
import FormModal from "../components/Modals/FormModal";
import CategoryForm from "../components/Forms/CategoryForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

const Categories = () => {
  // table data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  // server pagination (same as Users)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // modal/menu state
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch || undefined,
        status: filterStatus || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      // backend: { success, data, pagination }
      setRows(Array.isArray(res?.data) ? res.data : []);
      setRowCount(res?.pagination?.total || 0);
    } catch (e) {
      toast.error(e.message || "Failed to fetch categories");
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
    if (!window.confirm("Delete this category?")) return;
    try {
      await categoryService.deleteCategory(id);
      toast.success("Category deleted");
      fetchData();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
    handleMenuClose();
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editItem) {
        await categoryService.updateCategory(editItem._id, formData);
        toast.success("Category updated");
      } else {
        await categoryService.createCategory(formData);
        toast.success("Category added");
      }
      setOpenModal(false);
      fetchData(); // refresh without reload
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  const statusColor = (s) => (s === "Active" ? "success" : "warning");

  // DataGrid columns (robust date)
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
            bgcolor: params.row.color || "primary.main",
            width: 40,
            height: 40,
            fontSize: 20,
          }}
        >
          {params.row.icon || "✨"}
        </Avatar>
      ),
    },
    { field: "name", headerName: "Category Name", width: 220 },
    { field: "description", headerName: "Description", width: 320 },
    {
      field: "productsCount",
      headerName: "Products",
      width: 120,
      renderCell: (p) => (
        <Chip label={p.value || 0} size="small" variant="outlined" />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => (
        <Chip label={p.value} size="small" color={statusColor(p.value)} />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 140,
      valueGetter: (params) => params.row?.createdAt || null,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleDateString("en-IN")
          : "N/A",
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
    <Box>
      {/* Top filter card — same as Users page style */}
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
                sx={{ flexGrow: 1, minWidth: 260 }}
              />

              <FormControl size="small" sx={{ minWidth: 140 }}>
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

              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
              >
                Add Category
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <Box sx={{ height: 631, width: "100%" }}>
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

      {/* Row actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(selectedRow)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => selectedRow && handleDelete(selectedRow._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Modal with form */}
      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editItem ? "Edit Category" : "Add New Category"}
      >
        <CategoryForm
          initialData={editItem}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default Categories;
