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
  Visibility,
  Clear,
  Warning,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemName }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Warning color="error" /> Confirm Deletion
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete user <strong>{itemName}</strong>? This
        action cannot be undone.
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

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState([
    { field: "createdAt", sort: "desc" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [openForm, setOpenForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const getAvatarUrl = (relative) => {
    if (!relative) return null;
    return relative.startsWith("http")
      ? relative
      : `${API_BASE_URL}${relative}`;
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch,
        role: filterRole,
        status: filterStatus,
        sortBy: sortModel[0]?.field || "createdAt",
        sortOrder: sortModel[0]?.sort || "desc",
      };
      const res = await getUsers(params);
      const list = (res?.data || []).map((u) => ({
        ...u,
        _avatarUrl: getAvatarUrl(u.profileImage),
      }));
      setUsers(list);
      setRowCount(res?.pagination?.total || 0);
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch, filterRole, filterStatus, sortModel]);

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

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete._id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
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

  const columns = [
    {
      field: "avatar",
      headerName: "",
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Avatar
          src={params.row._avatarUrl}
          alt={params.row.name}
          sx={{ width: 32, height: 32 }}
        >
          {!params.row._avatarUrl ? "👤" : null}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      width: 180,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 220,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">
          {p.value}
        </Typography>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2">{p.value || "—"}</Typography>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      width: 110,
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
      width: 110,
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
      width: 130,
      renderCell: (params) => (
        <Typography variant="caption">
          {params.row.createdAt
            ? new Date(params.row.createdAt).toLocaleDateString("en-IN")
            : "—"}
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
              <TextField
                placeholder="Search users..."
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
              <FormControl size="small" sx={{ minWidth: 140 }}>
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
              <FormControl size="small" sx={{ minWidth: 140 }}>
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
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
                sx={{ whiteSpace: "nowrap", height: 40 }}
              >
                Add User
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <DataGrid
            rows={users}
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

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleView(selectedUser)}>
            <Visibility sx={{ mr: 1, fontSize: 20 }} /> View
          </MenuItem>
          <MenuItem onClick={() => handleEdit(selectedUser)}>
            <Edit sx={{ mr: 1, fontSize: 20 }} /> Edit
          </MenuItem>
          <MenuItem
            onClick={() => confirmDelete(selectedUser)}
            sx={{ color: "error.main" }}
          >
            <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete
          </MenuItem>
        </Menu>

        {openForm && (
          <UserForm
            open={openForm}
            onClose={() => setOpenForm(false)}
            initialData={editUser}
            onSaved={() => {
              setOpenForm(false);
              fetchUsers();
            }}
          />
        )}

        <UserViewModal
          open={Boolean(viewUser)}
          onClose={() => setViewUser(null)}
          user={viewUser}
          onEdit={(user) => {
            setViewUser(null);
            handleEdit(user);
          }}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          itemName={userToDelete?.name}
        />
      </Box>
    </motion.div>
  );
};

export default Users;
