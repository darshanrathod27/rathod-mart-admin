import React, { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import ProductViewModal from "../components/Modals/ProductViewModal";
import ImageUploadModal from "../components/Modals/ImageUploadModal";
import VariantStockModal from "../components/Modals/VariantStockModal";
import { motion } from "framer-motion";
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
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Rating,
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
  AddPhotoAlternate,
} from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import ProductForm from "../components/Forms/ProductForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openImageUploadModal, setOpenImageUploadModal] = useState(false);
  const [openVariantModal, setOpenVariantModal] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔄 Fetching products...");
      const response = await productService.getProducts({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearchTerm,
        category: filterCategory,
        status: filterStatus,
      });
      console.log("✅ Products fetched:", response.data.products.length);
      setProducts(response.data.products);
      setRowCount(response.data.pagination.total);
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
      setError("Failed to load products. Please try again.");
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterCategory, filterStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories({ limit: 100 });
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddProduct = () => {
    setEditProduct(null);
    setOpenModal(true);
  };

  const handleEditProduct = async (product) => {
    try {
      // Fetch full product details including images
      console.log("📝 Fetching product details for edit:", product._id);
      const response = await productService.getProduct(product._id);
      const fullProduct = response.data;
      console.log("✅ Full product data:", fullProduct);
      setEditProduct(fullProduct);
      setOpenModal(true);
      handleMenuClose();
    } catch (error) {
      console.error("❌ Failed to fetch product details:", error);
      toast.error("Failed to load product details");
    }
  };

  const handleViewProduct = async (product) => {
    try {
      console.log("👁️ Fetching product for view:", product._id);
      const response = await productService.getProduct(product._id);
      setViewProduct(response.data);
      setOpenViewModal(true);
      handleMenuClose();
    } catch (error) {
      console.error("❌ Failed to fetch product:", error);
      toast.error("Failed to load product");
    }
  };

  const handleOpenImageUpload = (product) => {
    setSelectedProduct(product);
    setOpenImageUploadModal(true);
    handleMenuClose();
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(productId);
        toast.success("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
    handleMenuClose();
  };

  const handleMenuClick = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStockClick = (product) => {
    setSelectedProduct(product);
    setOpenVariantModal(true);
  };

  const handleFormSubmit = async (formData) => {
    const { image, ...productData } = formData;
    try {
      console.log("💾 Submitting product:", editProduct ? "Update" : "Create");

      const response = editProduct
        ? await productService.updateProduct(editProduct._id, productData)
        : await productService.createProduct(productData);

      toast.success(
        `Product ${editProduct ? "updated" : "created"} successfully!`
      );

      const productId = response.data._id;

      // Upload image if provided
      if (image) {
        console.log("📤 Uploading image for product:", productId);
        const imageFormData = new FormData();
        imageFormData.append("image", image);
        await productService.uploadProductImage(productId, imageFormData);
        toast.success("Image uploaded successfully!");
      }

      setOpenModal(false);
      fetchProducts();
    } catch (error) {
      console.error("❌ Form submit error:", error);
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleFilter = () => {
    fetchProducts();
    toast.success("Filters applied!");
  };

  const getStockStatusColor = (stock) =>
    stock === 0 ? "error" : stock <= 10 ? "warning" : "success";

  const columns = [
    {
      field: "images",
      headerName: "Image",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const primaryImage =
          params.row.images?.find((img) => img.isPrimary) ||
          params.row.images?.[0];
        const imageUrl = primaryImage
          ? `${API_BASE_URL}${primaryImage.imageUrl}`
          : "";

        console.log(
          "🖼️ Rendering image for product:",
          params.row.name,
          "URL:",
          imageUrl
        );

        return (
          <Avatar
            src={imageUrl}
            variant="rounded"
            sx={{ width: 50, height: 50, bgcolor: "grey.200" }}
            onError={(e) => {
              console.error("❌ Image load error for:", imageUrl);
              e.target.style.display = "none";
            }}
            onLoad={() => {
              console.log("✅ Image loaded:", imageUrl);
            }}
          >
            {!primaryImage && (params.row.icon || "📦")}
          </Avatar>
        );
      },
    },
    {
      field: "name",
      headerName: "Product Name",
      width: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="600">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.description?.substring(0, 40)}...
          </Typography>
        </Box>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <Chip
            label={params.value.name}
            size="small"
            sx={{
              bgcolor: `${params.value.color}20`,
              color: params.value.color,
              fontWeight: 600,
            }}
          />
        ) : (
          <Chip label="N/A" size="small" />
        ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (params) => `₹${params.row.price.toLocaleString("en-IN")}`,
    },
    {
      field: "stock",
      headerName: "Total Stock",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStockStatusColor(params.value)}
          onClick={() => handleStockClick(params.row)}
          sx={{
            fontWeight: 600,
            cursor: "pointer",
            "&:hover": { transform: "scale(1.05)" },
          }}
        />
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 120,
      renderCell: (params) => (
        <Rating value={Number(params.value) || 0} size="small" readOnly />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Active" ? "success" : "warning"}
          size="small"
        />
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

  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchProducts}>
          Retry
        </Button>
      </Box>
    );

  return (
    <Box>
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
              placeholder="Search products..."
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
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={handleFilter}
            >
              Filter
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <Box sx={{ height: 631, width: "100%" }}>
          <DataGrid
            rows={products}
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
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewProduct(selectedProduct)}>
          <Visibility sx={{ mr: 1, fontSize: 20 }} /> View
        </MenuItem>
        <MenuItem onClick={() => handleEditProduct(selectedProduct)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => handleOpenImageUpload(selectedProduct)}>
          <AddPhotoAlternate sx={{ mr: 1, fontSize: 20 }} /> Images
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteProduct(selectedProduct?._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete
        </MenuItem>
      </Menu>
      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editProduct ? "Edit Product" : "Add New Product"}
        maxWidth="md"
      >
        <ProductForm
          initialData={editProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
        />
      </FormModal>
      <ProductViewModal
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        product={viewProduct}
      />
      {selectedProduct && (
        <ImageUploadModal
          open={openImageUploadModal}
          onClose={() => setOpenImageUploadModal(false)}
          product={selectedProduct}
          onUploadSuccess={fetchProducts}
        />
      )}
      <VariantStockModal
        open={openVariantModal}
        onClose={() => setOpenVariantModal(false)}
        product={selectedProduct}
      />
    </Box>
  );
};
export default Products;
