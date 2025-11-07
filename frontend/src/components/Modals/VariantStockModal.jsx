// src/components/Modals/VariantStockModal.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { inventoryService } from "../../services/inventoryService";
import toast from "react-hot-toast";

export default function VariantStockModal({ open, onClose, product, onSaved }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!product?._id) return;
    setLoading(true);
    try {
      // Use inventoryService: returns variants with currentStock (ledger-based)
      const list = await inventoryService.getProductVariants(product._id);
      setVariants(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Variant load error:", e);
      toast.error("Failed to load variants");
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?._id]);

  const columns = useMemo(
    () => [
      {
        field: "sku",
        headerName: "SKU",
        width: 140,
        renderCell: (p) => p?.row?.sku || "-",
      },
      {
        field: "size",
        headerName: "Size",
        width: 120,
        renderCell: (p) => p?.row?.size?.sizeName || p?.row?.size?.value || "-",
      },
      {
        field: "color",
        headerName: "Color",
        width: 120,
        renderCell: (p) =>
          p?.row?.color?.colorName || p?.row?.color?.value || "-",
      },
      {
        field: "price",
        headerName: "Price",
        width: 120,
        renderCell: (p) => `₹${Number(p?.row?.price ?? 0)}`,
      },
      {
        field: "currentStock",
        headerName: "Stock",
        width: 110,
        renderCell: (p) => Number(p?.row?.currentStock ?? p?.row?.stock ?? 0),
      },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: (p) => p?.row?.status || "Inactive",
      },
    ],
    []
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Variant Stock — {product?.name || ""}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
          All variants with live stock (sourced from Inventory Ledger).
        </Typography>
        <DataGrid
          autoHeight
          rows={variants}
          columns={columns}
          getRowId={(r) => r._id || r.id}
          loading={loading}
          hideFooterSelectedRowCount
          hideFooterPagination
          disableRowSelectionOnClick
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={async () => {
            await load(); // reload latest
            if (typeof onSaved === "function") onSaved();
          }}
        >
          Refresh
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
