// frontend/src/pages/Categories.jsx
import React, { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, MoreVert, Edit, Delete } from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import CategoryForm from "../components/Forms/CategoryForm";
import toast from "react-hot-toast";
import SearchAutocomplete from "../components/Common/SearchAutocomplete"; // Import new search

const Categories = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getCategories({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: searchTerm, // Passed from autocomplete
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setRows(res.data || []);
      setRowCount(res.pagination?.total || 0);
    } catch (e) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await categoryService.deleteCategory(id);
      toast.success("Category deleted");
      fetchData();
    } catch (e) {
      toast.error("Delete failed");
    }
    setAnchorEl(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editItem) {
        await categoryService.updateCategory(editItem._id, formData);
        toast.success("Updated successfully");
      } else {
        await categoryService.createCategory(formData);
        toast.success("Created successfully");
      }
      setOpenModal(false);
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Operation failed");
    }
  };

  // Simplified Autocomplete Fetcher
  const fetchSuggestions = async (query) => {
    const res = await categoryService.getCategories({
      search: query,
      limit: 5,
    });
    return res.data.map((c) => c.name);
  };

  const columns = [
    {
      field: "icon",
      headerName: "",
      width: 60,
      renderCell: (p) => (
        <Avatar
          sx={{ bgcolor: p.row.color, width: 32, height: 32, fontSize: 18 }}
        >
          {p.row.icon}
        </Avatar>
      ),
    },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1.5 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (p) => (
        <Chip
          label={p.value}
          size="small"
          color={p.value === "Active" ? "success" : "default"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      width: 80,
      renderCell: (p) => (
        <IconButton
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
            setSelectedRow(p.row);
          }}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
            <SearchAutocomplete
              placeholder="Search categories..."
              onSelect={(val) => setSearchTerm(val)}
              fetchSuggestions={fetchSuggestions}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditItem(null);
              setOpenModal(true);
            }}
          >
            Add Category
          </Button>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r._id}
          loading={loading}
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          autoHeight
        />
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setEditItem(selectedRow);
            setOpenModal(true);
            setAnchorEl(null);
          }}
        >
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDelete(selectedRow._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editItem ? "Edit Category" : "Add Category"}
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
