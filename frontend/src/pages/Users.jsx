// frontend/src/pages/Users.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getUsers, deleteUser } from "../services/userService";
import UserForm from "../components/Forms/UserForm.jsx";
import UserViewModal from "../components/Modals/UserViewModal.jsx"; // 1. Import new modal
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
  MoreVert,
  Edit,
  Delete,
  Visibility, // 2. Import View icon
} from "@mui/icons-material";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Users = () => {
  // table data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  // server pagination (same as Categories.jsx style)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // form & menu
  const [openForm, setOpenForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUser, setViewUser] = useState(null); // 3. Add state for view modal

  // absolute image helper
  const getAvatarUrl = (relative) => {
    if (!relative) return null;
    return relative.startsWith("http")
      ? relative
      : `${API_BASE_URL}${relative}`;
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: debouncedSearch,
        role: filterRole,
        status: filterStatus,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      // normalize rows + absolute avatar url
      const list = (res?.data || []).map((u) => ({
        ...u,
        _avatarUrl: getAvatarUrl(u.profileImage),
      }));

      setUsers(list);
      setRowCount(res?.pagination?.total || 0);
    } catch (e) {
      toast.error(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch, filterRole, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // 4. Add handler for View
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
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      toast.success("User deleted");
      fetchUsers();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
    handleMenuClose();
  };

  // 5. Update columns
  const columns = [
    {
      field: "avatar",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar
          src={params.row._avatarUrl || undefined}
          sx={{ width: 40, height: 40, bgcolor: "grey.200" }}
        >
          {!params.row._avatarUrl ? "👤" : null}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      width: 220,
    },
    {
      field: "email",
      headerName: "Email",
      width: 260,
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      renderCell: (p) => p.value || "—",
    },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      renderCell: (p) => (
        <Chip
          label={p.value || "customer"}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ textTransform: "capitalize" }}
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
          size="small"
          variant="filled"
          color={p.value === "active" ? "success" : "warning"}
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "_id", // 6. Add User ID column
      headerName: "User ID",
      width: 240,
      renderCell: (p) => (
        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
          {p.value}
        </Typography>
      ),
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
      {/* Top filter card — same layout as Categories */}
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
                placeholder="Search users..."
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

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Role"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                </Select>
              </FormControl>

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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
              >
                Add User
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data grid card — same styling as Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <Box sx={{ height: 631, width: "100%" }}>
            <DataGrid
              rows={users}
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

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleView(selectedUser)}>
          <Visibility sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEdit(selectedUser)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => selectedUser && handleDelete(selectedUser._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Form modal re-use */}
      {openForm && (
        <UserForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          initialData={editUser}
          onSaved={() => {
            setOpenForm(false);
            fetchUsers();
          }}
          embedded={false} // Use the full modal form
        />
      )}

      {/* 7. Add the View Modal */}
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
  );
};

export default Users;
