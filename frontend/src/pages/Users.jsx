// frontend/src/pages/Users.jsx

import React, { useState, useEffect, useCallback } from "react";
import { getUsers, deleteUser } from "../services/userService";
import UserForm from "../components/Forms/UserForm.jsx";
import UserViewModal from "../components/Modals/UserViewModal.jsx";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
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
  Visibility,
  FilterList,
  Clear,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Users = () => {
  // Table data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  // Server pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // ✅ ADVANCED SEARCH - Searches name, email, phone, username
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Filters
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortModel, setSortModel] = useState([
    { field: "createdAt", sort: "desc" },
  ]);

  // Form & Menu
  const [openForm, setOpenForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  // Avatar helper
  const getAvatarUrl = (relative) => {
    if (!relative) return null;
    return relative.startsWith("http")
      ? relative
      : `${API_BASE_URL}${relative}`;
  };

  // ✅ Fetch Users with Advanced Search
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch, // ✅ Searches name, email, phone, username
        role: filterRole,
        status: filterStatus,
        sortBy: sortModel[0]?.field || "createdAt",
        sortOrder: sortModel[0]?.sort || "desc",
      };

      const res = await getUsers(params);

      // Normalize rows with absolute avatar URL
      const list = (res?.data || []).map((u) => ({
        ...u,
        _avatarUrl: getAvatarUrl(u.profileImage),
      }));

      setUsers(list);
      setRowCount(res?.pagination?.total || 0);
    } catch (e) {
      console.error("Fetch users error:", e);
      toast.error(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch, filterRole, filterStatus, sortModel]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ✅ Clear All Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterRole("");
    setFilterStatus("");
    setPaginationModel({ page: 0, pageSize: 10 });
  };

  const handleAdd = () => {
    setEditUser(null);
    setOpenForm(true);
  };

  const handleMenuClick = (e, user) => {
    setAnchorEl(e.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleView = (user) => {
    setViewUser(user);
    handleMenuClose();
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setOpenForm(true);
    handleMenuClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This action cannot be undone."))
      return;
    try {
      await deleteUser(id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(e.message || "Delete failed");
    }
    handleMenuClose();
  };

  // ✅ DataGrid Columns
  const columns = [
    {
      field: "avatar",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar
          src={params.row._avatarUrl}
          alt={params.row.name}
          sx={{ width: 40, height: 40 }}
        >
          {!params.row._avatarUrl ? "👤" : null}
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
      field: "email",
      headerName: "Email",
      width: 240,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">
          {p.value}
        </Typography>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 140,
      renderCell: (p) => (
        <Typography variant="body2">{p.value || "—"}</Typography>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      renderCell: (p) => (
        <Chip
          label={p.value}
          color={p.value === "admin" ? "primary" : "default"}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => {
        const colorMap = {
          active: "success",
          inactive: "warning",
          blocked: "error",
        };
        return (
          <Chip
            label={p.value}
            color={colorMap[p.value?.toLowerCase()] || "default"}
            size="small"
            sx={{ textTransform: "capitalize" }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
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
            Users Management
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            Add User
          </Button>
        </Box>

        {/* Search and Filters Card */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Search Bar - Searches name, email, phone, username */}
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  placeholder="Search by name, email, phone, or username..."
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
                  sx={{ flexGrow: 1, minWidth: 250 }}
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
              {(searchTerm || filterRole || filterStatus) && (
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
                <Stack direction="row" spacing={2}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={filterRole}
                      label="Role"
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="staff">Staff</MenuItem>
                      <MenuItem value="customer">Customer</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="blocked">Blocked</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* DataGrid Card */}
        <Card>
          <Box sx={{ width: "100%" }}>
            <DataGrid
              rows={users}
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
          <MenuItem onClick={() => handleView(selectedUser)}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View Details
          </MenuItem>
          <MenuItem onClick={() => handleEdit(selectedUser)}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => selectedUser && handleDelete(selectedUser._id)}
            sx={{ color: "error.main" }}
          >
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>

        {/* User Form Modal */}
        {openForm && (
          <UserForm
            open={openForm}
            onClose={() => setOpenForm(false)}
            initialData={editUser}
            onSaved={() => {
              setOpenForm(false);
              fetchUsers();
            }}
            embedded={false}
          />
        )}

        {/* User View Modal */}
        {viewUser && (
          <UserViewModal
            open={Boolean(viewUser)}
            onClose={() => setViewUser(null)}
            user={viewUser}
            onEdit={(user) => {
              setViewUser(null);
              handleEdit(user);
            }}
          />
        )}
      </Box>
    </motion.div>
  );
};

export default Users;
