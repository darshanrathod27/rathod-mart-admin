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
import { motion } from "framer-motion";
import FormModal from "../components/Modals/FormModal";
import CategoryForm from "../components/Forms/CategoryForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

// --- Delete Confirmation Component ---
const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemName }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Warning color="error" /> Confirm Deletion
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete category <strong>{itemName}</strong>?
        This action cannot be undone.
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

const Categories = () => {
  // Table Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  // Pagination & Sorting
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState([
    { field: "createdAt", sort: "desc" },
  ]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // UI State
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch,
        status: filterStatus,
        sortBy: sortModel[0]?.field || "createdAt",
        sortOrder: sortModel[0]?.sort || "desc",
      };
      const res = await categoryService.getCategories(params);
      setRows(Array.isArray(res?.data) ? res.data : []);
      setRowCount(res?.pagination?.total || 0);
    } catch (e) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch, filterStatus, sortModel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
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

  const confirmDelete = (row) => {
    setItemToDelete(row);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await categoryService.deleteCategory(itemToDelete._id);
      toast.success("Category deleted successfully");
      fetchData();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editItem) {
        await categoryService.updateCategory(editItem._id, formData);
        toast.success("Category updated");
      } else {
        await categoryService.createCategory(formData);
        toast.success("Category created");
      }
      setOpenModal(false);
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Operation failed");
    }
  };

  const columns = [
    {
      field: "icon",
      headerName: "Icon",
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Avatar
          sx={{
            bgcolor: params.row.color || "#1976d2",
            width: 32,
            height: 32,
            fontSize: "1rem",
          }}
        >
          {params.row.icon || "✨"}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      minWidth: 250,
      renderCell: (p) => (
        <Typography variant="caption" color="text.secondary" noWrap>
          {p.value || "—"}
        </Typography>
      ),
    },
    {
      field: "productsCount",
      headerName: "Products",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Chip label={p.value || 0} size="small" variant="outlined" />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (p) => (
        <Chip
          label={p.value}
          color={
            String(p.value).toLowerCase() === "active" ? "success" : "default"
          }
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 130,
      renderCell: (p) => (
        <Typography variant="caption">
          {p.value
            ? new Date(p.value).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 70,
      sortable: false,
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{ p: 3 }}>
        {/* --- Header: Single Row --- */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Search */}
              <TextField
                placeholder="Search categories..."
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
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm("")}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 220 }}
              />

              {/* Filter */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* Add Button */}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
                sx={{ whiteSpace: "nowrap", height: 40 }}
              >
                Add Category
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* --- Table --- */}
        <Card>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row._id}
            rowCount={rowCount}
            loading={loading}
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
            }}
          />
        </Card>

        {/* --- Menus & Modals --- */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleEdit(selectedRow)}>
            <Edit sx={{ mr: 1, fontSize: 20 }} /> Edit
          </MenuItem>
          <MenuItem
            onClick={() => confirmDelete(selectedRow)}
            sx={{ color: "error.main" }}
          >
            <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete
          </MenuItem>
        </Menu>

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

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          itemName={itemToDelete?.name}
        />
      </Box>
    </motion.div>
  );
};

export default Categories;
