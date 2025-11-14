// src/components/Modals/UserViewModal.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Close,
  Person,
  Email,
  Phone,
  CalendarToday,
  Badge,
  Home,
  CheckCircle,
  Cancel,
  Block,
  Edit,
} from "@mui/icons-material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DetailItem = ({ icon, primary, secondary }) => (
  <ListItem>
    <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
      {icon}
    </ListItemIcon>
    <ListItemText primary={primary} secondary={secondary || "N/A"} />
  </ListItem>
);

const UserViewModal = ({ open, onClose, user, onEdit }) => {
  if (!user) return null;

  const getAvatarUrl = (relative) => {
    if (!relative) return null;
    return relative.startsWith("http")
      ? relative
      : `${API_BASE_URL}${relative}`;
  };

  const getStatusChip = () => {
    if (user.status === "active") {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Active"
          color="success"
          size="small"
        />
      );
    }
    if (user.status === "inactive") {
      return (
        <Chip icon={<Cancel />} label="Inactive" color="warning" size="small" />
      );
    }
    return <Chip icon={<Block />} label="Blocked" color="error" size="small" />;
  };

  const address = user.address || {};
  const fullAddress = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Person sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            User Details
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Grid container>
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              p: 3,
              bgcolor: "rgba(76, 175, 80, 0.05)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar
              src={getAvatarUrl(user.profileImage)}
              sx={{
                width: 140,
                height: 140,
                border: "4px solid",
                borderColor: "primary.main",
                boxShadow: 3,
              }}
            >
              <Person sx={{ fontSize: 80 }} />
            </Avatar>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "primary.dark" }}
            >
              {user.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              @{user.username || "n/a"}
            </Typography>
            <Chip
              label={user.role}
              color="primary"
              variant="filled"
              sx={{ textTransform: "capitalize", fontWeight: 600 }}
            />
            {getStatusChip()}
          </Grid>

          <Grid item xs={12} md={8}>
            <List sx={{ p: 2 }}>
              <DetailItem
                icon={<Email />}
                primary="Email Address"
                secondary={user.email}
              />
              <DetailItem
                icon={<Phone />}
                primary="Phone Number"
                secondary={user.phone}
              />
              <DetailItem
                icon={<CalendarToday />}
                primary="Birthday"
                secondary={
                  user.birthday
                    ? new Date(user.birthday).toLocaleDateString("en-IN")
                    : "N/A"
                }
              />
              <DetailItem
                icon={<Badge />}
                primary="User ID"
                secondary={user._id}
              />
              <Divider sx={{ my: 1 }} />
              <DetailItem
                icon={<Home />}
                primary="Address"
                secondary={fullAddress || "No address set"}
              />
            </List>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => onEdit?.(user)}
          startIcon={<Edit />}
          color="primary"
        >
          Edit User
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserViewModal;
