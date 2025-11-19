// frontend/src/pages/InventoryMaster.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  Typography,
  Chip,
  Stack,
  Divider,
  Autocomplete,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search,
  Add,
  Remove,
  TrendingUp,
  TrendingDown,
  Inventory2,
  Clear,
  History,
} from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import InventoryForm from "../components/Forms/InventoryForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { productService } from "../services/productService";
import { inventoryService } from "../services/inventoryService";

// Helper for date formatting
const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const InventoryMaster = () => {
  // --- State ---
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // Object { _id, name ... }

  // Ledger Search
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Data
  const [variants, setVariants] = useState([]);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Summary Data
  const [summary, setSummary] = useState({
    totalPurchase: 0,
    totalSale: 0,
    currentStock: 0,
  });

  // Pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Modal State
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'reduce'
  const [formInitialData, setFormInitialData] = useState(null); // { product, variant }

  // --- 1. Load Products for Filter ---
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productService.getProducts({
          limit: 1000,
          status: "active",
        });
        const list = Array.isArray(res?.data) ? res.data : res || [];
        setProducts(list);
      } catch (e) {
        console.error("Product load error", e);
      }
    };
    loadProducts();
  }, []);

  // --- 2. Fetch Data (Auto-Apply) ---

  // A. Fetch Stock Summary & Variants (When Product Changes)
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!selectedProduct) {
        setVariants([]);
        setSummary({ totalPurchase: 0, totalSale: 0, currentStock: 0 });
        return;
      }

      setLoadingVariants(true);
      try {
        const [summaryRes, variantsRes] = await Promise.all([
          inventoryService.getStockSummary(selectedProduct._id),
          inventoryService.getProductVariants(selectedProduct._id),
        ]);

        setSummary({
          totalPurchase: summaryRes?.totalPurchase || 0,
          totalSale: summaryRes?.totalSale || 0,
          currentStock: summaryRes?.currentStock || 0,
        });
        setVariants(Array.isArray(variantsRes) ? variantsRes : []);
      } catch (e) {
        console.error("Details fetch error", e);
      } finally {
        setLoadingVariants(false);
      }
    };

    fetchProductDetails();
  }, [selectedProduct]);

  // B. Fetch Ledger (When Search, Product, or Page Changes)
  const fetchLedger = useCallback(async () => {
    setLoadingLedger(true);
    try {
      const res = await inventoryService.getInventoryLedger({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        product: selectedProduct?._id,
        search: debouncedSearch,
      });

      const rows = res?.ledgers || res?.data?.ledgers || [];
      const total = res?.pagination?.total || res?.data?.pagination?.total || 0;

      setLedgerRows(Array.isArray(rows) ? rows : []);
      setLedgerCount(total);
    } catch (e) {
      console.error("Ledger fetch error", e);
    } finally {
      setLoadingLedger(false);
    }
  }, [paginationModel, selectedProduct, debouncedSearch]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // --- Handlers ---

  const handleOpenForm = (mode, product = null, variant = null) => {
    setFormMode(mode);
    // If opened from row, pre-fill data. If from top button, use selectedProduct if available
    setFormInitialData({
      product: product || selectedProduct, // Use row product OR filter product
      variant: variant,
    });
    setOpenForm(true);
  };

  const handleSuccess = () => {
    setOpenForm(false);
    toast.success(
      formMode === "add"
        ? "Stock Added Successfully"
        : "Stock Reduced Successfully"
    );
    // Refresh data
    fetchLedger();
    // Trigger re-fetch of variants by momentarily creating a new object reference or relying on the fact that we just updated
    // A simple way is to just re-run the effect logic manually or toggle a dummy state,
    // but since ledger updates, let's also re-fetch variants if product is selected.
    if (selectedProduct) {
      inventoryService
        .getProductVariants(selectedProduct._id)
        .then((res) => setVariants(res || []));
      inventoryService
        .getStockSummary(selectedProduct._id)
        .then((res) => setSummary(res || {}));
    }
  };

  // --- Columns ---

  const variantColumns = useMemo(
    () => [
      {
        field: "sku",
        headerName: "SKU",
        width: 150,
        renderCell: (p) => (
          <Typography variant="body2" fontFamily="monospace">
            {p.value || "—"}
          </Typography>
        ),
      },
      {
        field: "size",
        headerName: "Size",
        width: 120,
        renderCell: (p) => p.row.size?.sizeName || "—",
      },
      {
        field: "color",
        headerName: "Color",
        width: 120,
        renderCell: (p) => (
          <Stack direction="row" alignItems="center" gap={1}>
            {p.row.color?.value && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: p.row.color.value,
                  border: "1px solid #ddd",
                }}
              />
            )}
            {p.row.color?.colorName || "—"}
          </Stack>
        ),
      },
      {
        field: "currentStock",
        headerName: "Current Stock",
        width: 140,
        renderCell: (p) => (
          <Chip
            label={p.value || 0}
            color={p.value > 10 ? "success" : p.value > 0 ? "warning" : "error"}
            size="small"
            sx={{ fontWeight: 700, minWidth: 60 }}
          />
        ),
      },
      {
        field: "actions",
        headerName: "Quick Actions",
        width: 180,
        sortable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Add Stock">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleOpenForm("add", selectedProduct, p.row)}
                sx={{
                  bgcolor: "primary.50",
                  "&:hover": { bgcolor: "primary.100" },
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reduce Stock">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleOpenForm("reduce", selectedProduct, p.row)}
                sx={{
                  bgcolor: "error.50",
                  "&:hover": { bgcolor: "error.100" },
                }}
              >
                <Remove fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [selectedProduct]
  );

  const ledgerColumns = [
    {
      field: "createdAt",
      headerName: "Date & Time",
      width: 160,
      renderCell: (p) => (
        <Stack>
          <Typography variant="caption" fontWeight={600} color="text.primary">
            {fmtDate(p.value).split(",")[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fmtDate(p.value).split(",")[1]}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 100,
      renderCell: (p) => (
        <Chip
          label={p.value}
          size="small"
          color={p.value === "IN" ? "success" : "error"}
          icon={p.value === "IN" ? <TrendingUp /> : <TrendingDown />}
          sx={{ borderRadius: 1, fontWeight: 600, minWidth: 70 }}
        />
      ),
    },
    {
      field: "product",
      headerName: "Product Details",
      flex: 1,
      minWidth: 250,
      renderCell: (p) => {
        const prodName = p.row.product?.name || "Unknown Product";
        const variantStr = p.row.variant
          ? `${p.row.variant.size?.sizeName || ""} • ${
              p.row.variant.color?.colorName || ""
            }`
          : "Base Product";
        return (
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap>
              {prodName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {variantStr}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 90,
      renderCell: (p) => (
        <Typography
          variant="body2"
          fontWeight={700}
          color={p.row.type === "IN" ? "success.main" : "error.main"}
        >
          {p.row.type === "IN" ? "+" : "-"}
          {p.value}
        </Typography>
      ),
    },
    {
      field: "balanceStock",
      headerName: "Balance",
      width: 100,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">
          {p.value}
        </Typography>
      ),
    },
    {
      field: "remarks",
      headerName: "Remarks",
      flex: 1,
      minWidth: 200,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {p.value || "-"}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* --- Header Controls --- */}
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* 1. Product Filter (Autocomplete) */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 280, flex: { xs: 1, md: 0 } }}
              options={products}
              getOptionLabel={(option) => option.name || ""}
              value={selectedProduct}
              onChange={(event, newValue) => setSelectedProduct(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Product to Manage Stock"
                  placeholder="Search product..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Inventory2 color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
            />

            {/* 2. Search Ledger */}
            <TextField
              placeholder="Search ledger history..."
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
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />

            {/* 3. Global Action Buttons */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => handleOpenForm("add")}
              sx={{ whiteSpace: "nowrap", height: 40 }}
            >
              Add Stock
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Remove />}
              onClick={() => handleOpenForm("reduce")}
              sx={{ whiteSpace: "nowrap", height: 40 }}
            >
              Reduce Stock
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* --- Product Specific View (Only if Product Selected) --- */}
      {selectedProduct && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Left: Summary Cards */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Paper
                sx={{ p: 2, bgcolor: "#e8f5e9", border: "1px solid #c8e6c9" }}
              >
                <Typography variant="subtitle2" color="success.dark">
                  Total Stock In
                </Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  +{summary.totalPurchase}
                </Typography>
              </Paper>
              <Paper
                sx={{ p: 2, bgcolor: "#ffebee", border: "1px solid #ffcdd2" }}
              >
                <Typography variant="subtitle2" color="error.dark">
                  Total Stock Out
                </Typography>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  -{summary.totalSale}
                </Typography>
              </Paper>
              <Paper
                sx={{ p: 2, bgcolor: "#e3f2fd", border: "1px solid #bbdefb" }}
              >
                <Typography variant="subtitle2" color="primary.dark">
                  Current Available
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {summary.currentStock}
                </Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* Right: Variants Table */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: "100%" }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Typography variant="h6" fontWeight={600}>
                  Variants & Stock Levels
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click <Add fontSize="inherit" /> or{" "}
                  <Remove fontSize="inherit" /> to adjust stock instantly.
                </Typography>
              </Box>
              <DataGrid
                rows={variants}
                columns={variantColumns}
                getRowId={(row) => row._id}
                loading={loadingVariants}
                hideFooter
                autoHeight
                disableRowSelectionOnClick
                sx={{ border: "none" }}
              />
            </Card>
          </Grid>
        </Grid>
      )}

      {/* --- Inventory Ledger Table --- */}
      <Card>
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <History color="action" />
          <Typography variant="h6" fontWeight={600}>
            Inventory History
          </Typography>
        </Box>
        <DataGrid
          rows={ledgerRows}
          columns={ledgerColumns}
          getRowId={(row) => row._id}
          loading={loadingLedger}
          rowCount={ledgerCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": { bgcolor: "#fafafa" },
          }}
        />
      </Card>

      {/* --- Modal Form --- */}
      <FormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={formMode === "add" ? "Add New Stock" : "Reduce Stock"}
        maxWidth="sm"
      >
        <InventoryForm
          mode={formMode}
          initialData={formInitialData} // Pass pre-selected product/variant
          onClose={() => setOpenForm(false)}
          onSuccess={handleSuccess}
        />
      </FormModal>
    </Box>
  );
};

export default InventoryMaster;
