import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Inventory2, TrendingUp, TrendingDown } from "@mui/icons-material";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
import { inventoryService } from "../services/inventoryService";
import { productService } from "../services/productService";

const InventoryMaster = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [variants, setVariants] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [rowCount, setRowCount] = useState(0);

  // Fetch all products for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts({ limit: 500 });
        setProducts(
          response.data.products.filter((p) => p.status === "Active")
        );
      } catch (error) {
        toast.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  // Fetch variants when product is selected
  useEffect(() => {
    if (selectedProduct) {
      fetchProductVariants();
      fetchStockSummary();
    } else {
      setVariants([]);
      setStockSummary(null);
    }
  }, [selectedProduct]);

  const fetchProductVariants = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProductVariants(
        selectedProduct
      );
      setVariants(response.data);
    } catch (error) {
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSummary = async () => {
    try {
      const response = await inventoryService.getStockSummary(selectedProduct);
      setStockSummary(response.data);
    } catch (error) {
      console.error("Failed to load stock summary");
    }
  };

  // Fetch ledger entries
  const fetchLedgerEntries = useCallback(async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const response = await inventoryService.getInventoryLedger({
        product: selectedProduct,
        type: filterType,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      setLedgerEntries(response.data.ledgers);
      setRowCount(response.data.pagination.total);
    } catch (error) {
      toast.error("Failed to load inventory ledger");
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, filterType, paginationModel]);

  useEffect(() => {
    fetchLedgerEntries();
  }, [fetchLedgerEntries]);

  const handleAddStock = async (variantId, quantity) => {
    try {
      await inventoryService.addStock({
        product: selectedProduct,
        variant: variantId,
        quantity,
        remarks: "Stock added from Inventory Master",
      });
      toast.success("Stock added successfully!");
      fetchProductVariants();
      fetchLedgerEntries();
      fetchStockSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add stock");
    }
  };

  const handleReduceStock = async (variantId, quantity) => {
    try {
      await inventoryService.reduceStock({
        product: selectedProduct,
        variant: variantId,
        quantity,
        remarks: "Stock reduced - Manual adjustment",
      });
      toast.success("Stock reduced successfully!");
      fetchProductVariants();
      fetchLedgerEntries();
      fetchStockSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reduce stock");
    }
  };

  const ledgerColumns = [
    {
      field: "createdAt",
      headerName: "Date & Time",
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {new Date(params.value).toLocaleDateString("en-IN")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(params.value).toLocaleTimeString("en-IN")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "variant",
      headerName: "Variant",
      width: 200,
      renderCell: (params) => {
        if (!params.value)
          return <Chip label="Base Product" size="small" color="primary" />;
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.value.size?.sizeName} • {params.value.color?.colorName}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "referenceType",
      headerName: "Type",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Purchase" ? "success" : "error"}
          icon={params.value === "Purchase" ? <TrendingUp /> : <TrendingDown />}
        />
      ),
    },
    {
      field: "type",
      headerName: "Movement",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          color={params.value === "IN" ? "success" : "error"}
        />
      ),
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 100,
      renderCell: (params) => (
        <Typography
          fontWeight={600}
          color={params.row.type === "IN" ? "success.main" : "error.main"}
        >
          {params.row.type === "IN" ? "+" : "-"}
          {params.value}
        </Typography>
      ),
    },
    {
      field: "balanceStock",
      headerName: "Balance",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value > 10
              ? "success"
              : params.value > 0
              ? "warning"
              : "error"
          }
        />
      ),
    },
    {
      field: "remarks",
      headerName: "Remarks",
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || "—"}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      {/* <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, color: "#2E7D32", mb: 1 }}
          >
            <Inventory2 sx={{ mr: 1, verticalAlign: "middle", fontSize: 32 }} />
            Inventory Master
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage stock levels, track inventory movements, and monitor product
            variants
          </Typography>
        </Box>
      </motion.div> */}

      {/* Product Selection */}
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <Box sx={{ p: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Product *</InputLabel>
            <Select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              label="Select Product *"
            >
              <MenuItem value="">
                <em>Choose a product</em>
              </MenuItem>
              {products.map((product) => (
                <MenuItem key={product._id} value={product._id}>
                  {product.name} - ₹{product.price}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Stock Summary Cards */}
      {selectedProduct && stockSummary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            <Card
              sx={{
                background: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  CURRENT STOCK
                </Typography>
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {stockSummary.currentStock}
                </Typography>
              </Box>
            </Card>
            <Card
              sx={{
                background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  TOTAL PURCHASE
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {stockSummary.totalPurchase}
                </Typography>
              </Box>
            </Card>
            <Card
              sx={{
                background: "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  TOTAL SALE
                </Typography>
                <Typography variant="h3" fontWeight={700} color="error.main">
                  {stockSummary.totalSale}
                </Typography>
              </Box>
            </Card>
          </Box>
        </motion.div>
      )}

      {/* Variants Table */}
      {selectedProduct && variants.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={600}>
              Product Variants & Stock Management
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {variants.map((variant) => (
              <Paper
                key={variant._id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  "&:hover": { boxShadow: 2 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {variant.size?.sizeName} • {variant.color?.colorName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Price: ₹{variant.price} • SKU: {variant.sku || "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Chip
                      label={`Stock: ${variant.currentStock}`}
                      color={
                        variant.currentStock > 10
                          ? "success"
                          : variant.currentStock > 0
                          ? "warning"
                          : "error"
                      }
                    />
                    <TextField
                      type="number"
                      size="small"
                      label="Quantity"
                      defaultValue={10}
                      sx={{ width: 100 }}
                      id={`qty-${variant._id}`}
                      inputProps={{ min: 1 }}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const qty = document.getElementById(
                            `qty-${variant._id}`
                          ).value;
                          handleAddStock(variant._id, parseInt(qty));
                        }}
                        style={{
                          padding: "8px 16px",
                          background:
                            "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        + Add
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const qty = document.getElementById(
                            `qty-${variant._id}`
                          ).value;
                          handleReduceStock(variant._id, parseInt(qty));
                        }}
                        style={{
                          padding: "8px 16px",
                          background:
                            "linear-gradient(135deg, #EF5350 0%, #C62828 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        - Reduce
                      </motion.button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Card>
      )}

      {/* Inventory Ledger */}
      {selectedProduct && (
        <Card>
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                📊 Inventory Ledger
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Movement Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Movement Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="IN">IN</MenuItem>
                  <MenuItem value="OUT">OUT</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={ledgerEntries}
              columns={ledgerColumns}
              getRowId={(row) => row._id}
              loading={loading}
              rowCount={rowCount}
              pageSizeOptions={[20, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode="server"
              disableRowSelectionOnClick
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "rgba(76, 175, 80, 0.05)",
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        </Card>
      )}

      {/* Empty State */}
      {!selectedProduct && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Inventory2 sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            Select a product to manage inventory
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Choose a product from the dropdown above to view variants and manage
            stock levels
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default InventoryMaster;
