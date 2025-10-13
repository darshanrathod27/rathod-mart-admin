import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  DialogActions,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Close } from "@mui/icons-material";
import { inventoryService } from "../../services/inventoryService";
import toast from "react-hot-toast";

const VariantStockModal = ({ open, onClose, product }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product?._id) {
      const fetchVariants = async () => {
        try {
          setLoading(true);
          const response = await inventoryService.getProductVariants(
            product._id
          );
          setVariants(response.data);
        } catch (error) {
          toast.error("Failed to load variant stock details.");
        } finally {
          setLoading(false);
        }
      };
      fetchVariants();
    }
  }, [open, product]);

  const columns = [
    {
      field: "variant",
      headerName: "Variant",
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {params.row.size?.sizeName || "Standard"} /{" "}
            {params.row.color?.colorName || "Standard"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            SKU: {params.row.sku || "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          ₹{params.value}
        </Typography>
      ),
    },
    {
      field: "currentStock",
      headerName: "Available Stock",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value > 10
              ? "success"
              : params.value > 0
              ? "warning"
              : "error"
          }
          sx={{ fontWeight: 600, width: 80 }}
        />
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Variant Stock Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product?.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : variants.length > 0 ? (
          <Box sx={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={variants}
              columns={columns}
              getRowId={(row) => row._id}
              disableRowSelectionOnClick
              sx={{ border: "none" }}
            />
          </Box>
        ) : (
          <Alert severity="info">
            No variants have been created for this product yet.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantStockModal;
