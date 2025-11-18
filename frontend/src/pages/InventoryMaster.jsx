// src/pages/InventoryMaster.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Chip,
  Alert,
  IconButton,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search, Add, Remove, Refresh } from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import InventoryForm from "../components/Forms/InventoryForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { productService } from "../services/productService";
import { inventoryService } from "../services/inventoryService";

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const InventoryMaster = () => {
  // filters
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debounced = useDebounce(searchTerm, 500);

  // data
  const [variants, setVariants] = useState([]);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // summary
  const [summary, setSummary] = useState({
    totalPurchase: 0,
    totalSale: 0,
    currentStock: 0,
  });

  // pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // modal
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState("add"); // 'add' | 'reduce'

  // Load products (null-safe to different API shapes)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productService.getProducts({
          limit: 1000,
          status: "active",
        });
        let list = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.products)) list = res.data.products;
        else if (Array.isArray(res?.products)) list = res.products;
        else if (Array.isArray(res)) list = res;
        setProducts(list || []);
      } catch {
        toast.error("Failed to load products");
        setProducts([]);
      }
    };
    loadProducts();
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!productId) {
      setSummary({ totalPurchase: 0, totalSale: 0, currentStock: 0 });
      return;
    }
    try {
      const s = await inventoryService.getStockSummary(productId);
      setSummary({
        totalPurchase: s?.totalPurchase || 0,
        totalSale: s?.totalSale || 0,
        currentStock: s?.currentStock || 0,
      });
    } catch {
      setSummary({ totalPurchase: 0, totalSale: 0, currentStock: 0 });
    }
  }, [productId]);

  const fetchVariants = useCallback(async () => {
    if (!productId) {
      setVariants([]);
      return;
    }
    try {
      const list = await inventoryService.getProductVariants(productId);
      setVariants(Array.isArray(list) ? list : []);
    } catch {
      setVariants([]);
    }
  }, [productId]);

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventoryLedger({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        product: productId || undefined,
        search: debounced || undefined,
      });
      const ledgers = res?.ledgers || res?.data?.ledgers || [];
      const pagination = res?.pagination || res?.data?.pagination || {};
      setLedgerRows(Array.isArray(ledgers) ? ledgers : []);
      setRowCount(pagination?.total || 0);
    } catch {
      toast.error("Failed to fetch inventory ledger");
      setLedgerRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, productId, debounced]);

  useEffect(() => {
    fetchSummary();
    fetchVariants();
    fetchLedger();
  }, [fetchSummary, fetchVariants, fetchLedger]);

  // Columns (renderCell only → null-safe)
  const variantColumns = useMemo(
    () => [
      {
        field: "size",
        headerName: "Size",
        width: 140,
        renderCell: (p) => p?.row?.size?.sizeName || p?.row?.size?.value || "—",
      },
      {
        field: "color",
        headerName: "Color",
        width: 140,
        renderCell: (p) =>
          p?.row?.color?.colorName || p?.row?.color?.value || "—",
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
        width: 120,
        renderCell: (p) => Number(p?.row?.currentStock ?? 0),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p?.row?.status || "Inactive"}
            color={
              (p?.row?.status || "").toLowerCase() === "active"
                ? "success"
                : "default"
            }
          />
        ),
      },
    ],
    []
  );

  const ledgerColumns = useMemo(
    () => [
      {
        field: "createdAt",
        headerName: "Date",
        width: 150,
        renderCell: (p) => fmtDate(p?.row?.createdAt || p?.row?.updatedAt),
      },
      {
        field: "referenceType",
        headerName: "Ref",
        width: 110,
        renderCell: (p) => p?.row?.referenceType || "-",
      },
      {
        field: "type",
        headerName: "Type",
        width: 100,
        renderCell: (p) => p?.row?.type || "-",
      },
      {
        field: "quantity",
        headerName: "Qty",
        width: 90,
        renderCell: (p) => Number(p?.row?.quantity ?? 0),
      },
      {
        field: "balanceStock",
        headerName: "Balance",
        width: 110,
        renderCell: (p) => Number(p?.row?.balanceStock ?? 0),
      },
      {
        field: "product",
        headerName: "Product",
        width: 220,
        renderCell: (p) => p?.row?.product?.name || p?.row?.productName || "—",
      },
      {
        field: "variant",
        headerName: "Variant",
        width: 260,
        renderCell: (p) => {
          const v = p?.row?.variant;
          if (!v) return "—";
          const sz = v?.size?.sizeName || v?.size?.value || "";
          const col = v?.color?.colorName || v?.color?.value || "";
          return `${sz}${sz && col ? " • " : ""}${col}`;
        },
      },
      {
        field: "remarks",
        headerName: "Remarks",
        width: 240,
        renderCell: (p) => p?.row?.remarks || "-",
      },
    ],
    []
  );

  const applyFilters = () => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchSummary();
    fetchVariants();
    fetchLedger();
    toast.success("Filters applied!");
  };

  const refreshAll = () => {
    fetchSummary();
    fetchVariants();
    fetchLedger();
    toast.success("Refreshed");
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Top controls kept simple like other pages */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Search remarks / type..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Filter by Product</InputLabel>
              <Select
                value={productId}
                label="Filter by Product"
                onChange={(e) => setProductId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Products</em>
                </MenuItem>
                {(products || []).map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={applyFilters}>
              Apply
            </Button>
            <IconButton onClick={refreshAll} title="Refresh">
              <Refresh />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Chip label={`Purchased: ${summary.totalPurchase}`} />
        <Chip label={`Sold: ${summary.totalSale}`} />
        <Chip
          color="success"
          label={`Current Stock: ${summary.currentStock}`}
        />
      </Box>

      {/* Variants card with its own Add/Reduce actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Variants (with current stock)
            </Typography>
            <Stack direction="row" gap={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setMode("add");
                  setOpenForm(true);
                }}
                disabled={!productId}
              >
                Add Stock
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<Remove />}
                onClick={() => {
                  setMode("reduce");
                  setOpenForm(true);
                }}
                disabled={!productId}
              >
                Reduce
              </Button>
            </Stack>
          </Stack>

          <DataGrid
            autoHeight
            rows={Array.isArray(variants) ? variants : []}
            columns={variantColumns}
            getRowId={(row) => row._id}
            hideFooterPagination
            hideFooterSelectedRowCount
            disableRowSelectionOnClick
          />
        </CardContent>
      </Card>

      {/* Ledger table */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Inventory Ledger
          </Typography>
          <DataGrid
            autoHeight
            rows={Array.isArray(ledgerRows) ? ledgerRows : []}
            columns={ledgerColumns}
            getRowId={(row) => row._id}
            loading={loading}
            rowCount={rowCount}
            pageSizeOptions={[10, 20, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            disableRowSelectionOnClick
          />
          {!productId && (
            <Alert sx={{ mt: 2 }} severity="info">
              Tip: Select a product to see variants and stock summary.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add/Reduce stock modal */}
      <FormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={mode === "add" ? "Add Stock" : "Reduce Stock"}
      >
        <InventoryForm
          productId={productId}
          mode={mode}
          onClose={() => setOpenForm(false)}
          onSuccess={() => {
            setOpenForm(false);
            refreshAll();
          }}
        />
      </FormModal>
    </Box>
  );
};

export default InventoryMaster;
