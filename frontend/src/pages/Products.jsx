// frontend/src/pages/Products.jsx
import React, { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import ProductViewModal from "../components/Modals/ProductViewModal";
import ImageUploadModal from "../components/Modals/ImageUploadModal";
import VariantStockModal from "../components/Modals/VariantStockModal";
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
  Tooltip,
  Badge,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  AddPhotoAlternate,
  Inventory as InventoryIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import ProductForm from "../components/Forms/ProductForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

// Enhanced API base URL configuration
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

  // Enhanced fetch function with error handling
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProducts({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearchTerm,
        category: filterCategory,
        status: filterStatus,
      });

      // Ensure images have proper URLs
      const productsWithImageUrls = response.data.products.map((product) => ({
        ...product,
        images:
          product.images?.map((img) => ({
            ...img,
            fullImageUrl: img.fullImageUrl || `${API_BASE_URL}${img.imageUrl}`,
          })) || [],
      }));

      setProducts(productsWithImageUrls);
      setRowCount(response.data.pagination.total);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to load products";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterCategory, filterStatus]);

  const fetchCategories = useCallback(async () => {
    try {
      // This correctly expects { data: { categories: [] } }
      const response = await categoryService.getCategories({ limit: 100 });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Enhanced image URL helper function
  const getImageUrl = useCallback((image) => {
    if (!image) return null;

    if (image.fullImageUrl) {
      return image.fullImageUrl;
    }

    if (image.imageUrl) {
      return image.imageUrl.startsWith("http")
        ? image.imageUrl
        : `${API_BASE_URL}${image.imageUrl}`;
    }

    return null;
  }, []);

  const handleAddProduct = () => {
    setEditProduct(null);
    setOpenModal(true);
  };

  const handleMenuClick = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleEditProduct = async (product) => {
    try {
      // This service call returns { data: ...product } directly
      const response = await productService.getProduct(product._id);
      setEditProduct(response.data);
      setOpenModal(true);
      handleMenuClose();
    } catch (error) {
      toast.error("Failed to load product details.");
    }
  };

  const handleViewProduct = async (product) => {
    try {
      // This service call returns { data: ...product } directly
      const response = await productService.getProduct(product._id);
      // Ensure images have proper URLs
      const productWithImageUrls = {
        ...response.data,
        images:
          response.data.images?.map((img) => ({
            ...img,
            fullImageUrl: getImageUrl(img),
          })) || [],
      };
      setViewProduct(productWithImageUrls);
      setOpenViewModal(true);
      handleMenuClose();
    } catch (error) {
      toast.error("Failed to load product details.");
    }
  };

  const handleOpenImageUpload = (product) => {
    setSelectedProduct(product);
    setOpenImageUploadModal(true);
    handleMenuClose();
  };

  const handleManageStock = (product) => {
    setSelectedProduct(product);
    setOpenVariantModal(true);
    handleMenuClose();
  };

  const handleDeleteProduct = async (productId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      try {
        await productService.deleteProduct(productId);
        toast.success("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete product"
        );
      }
    }
    handleMenuClose();
  };

  const handleFormSubmit = async (formData) => {
    // FormData image logic is for single main image, which you can keep or remove
    const { image, ...productData } = formData;
    try {
      const response = editProduct
        ? await productService.updateProduct(editProduct._id, productData)
        : await productService.createProduct(productData);

      toast.success(
        `Product ${editProduct ? "updated" : "created"} successfully!`
      );

      // Handle image upload if provided (This is for the old single image logic)
      if (image) {
        // The create/update response returns { data: ...product }
        const productId = response.data._id;
        const imageFormData = new FormData();
        imageFormData.append("image", image);

        try {
          await productService.uploadProductImage(productId, imageFormData);
          toast.success("Image uploaded successfully!");
        } catch (imgError) {
          toast.error("Product saved but image upload failed");
        }
      }

      setOpenModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  // Handle successful image upload
  const handleImageUploadSuccess = useCallback(() => {
    toast.success("Images uploaded successfully!");
    fetchProducts(); // Refresh the product list
    setOpenImageUploadModal(false);
  }, [fetchProducts]);

  // ⭐⭐⭐ FIXED COLUMN DEFINITIONS - MUI v7 SYNTAX ⭐⭐⭐
  const columns = [
    {
      field: "images",
      headerName: "Image",
      width: 90,
      sortable: false,
      renderCell: (params) => {
        const images = params.row.images || [];
        const primaryImage = images.find((img) => img.isPrimary) || images[0];
        const imageUrl = primaryImage ? getImageUrl(primaryImage) : null;
        const imageCount = images.length;

        return (
          <Tooltip title={`${imageCount} image(s)`}>
            <Badge badgeContent={imageCount} color="primary" max={99}>
              <Avatar
                src={imageUrl}
                variant="rounded"
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: "grey.200",
                  cursor: imageUrl ? "pointer" : "default",
                  border: imageUrl
                    ? "2px solid transparent"
                    : "2px dashed #ccc",
                  "&:hover": imageUrl
                    ? {
                        border: "2px solid #1976d2",
                        transform: "scale(1.05)",
                      }
                    : {},
                }}
                onClick={() => imageUrl && handleViewProduct(params.row)}
              >
                {imageUrl ? null : <ImageIcon />}
              </Avatar>
            </Badge>
          </Tooltip>
        );
      },
    },
    {
      field: "name",
      headerName: "Product Name",
      width: 280,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            SKU: {params.row.sku || "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      // ✅ FIXED: MUI v7 signature (value, row) instead of (params)
      valueGetter: (value, row) => {
        // Safe access with null checks
        if (!row) return "N/A";
        if (row.category && typeof row.category === "object") {
          return row.category.name || "Uncategorized";
        }
        if (row.category && typeof row.category === "string") {
          return row.category;
        }
        return "N/A";
      },
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: "basePrice",
      headerName: "Price",
      width: 120,
      // ✅ FIXED: MUI v7 signature (value, row)
      valueGetter: (value, row) => {
        if (!row) return 0;
        return row.basePrice || 0;
      },
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          ₹{params.value?.toLocaleString("en-IN") || "0"}
        </Typography>
      ),
    },
    {
      field: "totalStock",
      headerName: "Stock",
      width: 100,
      // ✅ FIXED: MUI v7 signature (value, row)
      valueGetter: (value, row) => {
        if (!row) return 0;
        return row.totalStock || 0;
      },
      renderCell: (params) => (
        <Tooltip title="Manage Variant Stock">
          <Box
            onClick={() => handleManageStock(params.row)}
            sx={{ cursor: "pointer", width: "100%" }}
          >
            <Chip
              label={params.value || 0}
              size="small"
              color={
                (params.value || 0) > 10
                  ? "success"
                  : (params.value || 0) > 0
                  ? "warning"
                  : "error"
              }
              variant="filled"
              sx={{ width: "80px" }}
            />
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 130,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Rating value={params.row.rating || 0} size="small" readOnly />
          <Typography variant="caption">
            ({params.row.reviewCount || 0})
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "active" ? "success" : "warning"}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleMenuClick(e, params.row)}
          size="small"
          sx={{
            "&:hover": {
              backgroundColor: "primary.light",
              color: "white",
            },
          }}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  if (error && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button onClick={fetchProducts} size="small">
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Enhanced Filter Section */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
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
              placeholder="Search products, SKU, brand..."
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
              sx={{ flexGrow: 1, minWidth: 280 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
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
                  <em>All Status</em>
                </MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddProduct}
              sx={{
                minWidth: 140,
                boxShadow: 2,
                "&:hover": { boxShadow: 4 },
              }}
            >
              Add Product
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Data Grid */}
      <Card sx={{ boxShadow: 3 }}>
        <Box sx={{ height: 700, width: "100%" }}>
          <DataGrid
            rows={products}
            columns={columns}
            getRowId={(row) => row._id}
            loading={loading}
            rowCount={rowCount}
            pageSizeOptions={[10, 20, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "action.hover",
                cursor: "pointer",
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
            }}
          />
        </Box>
      </Card>

      {/* Enhanced Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 },
        }}
      >
        <MenuItem onClick={() => handleViewProduct(selectedProduct)}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditProduct(selectedProduct)}>
          <Edit sx={{ mr: 1 }} /> Edit Product
        </MenuItem>
        <MenuItem onClick={() => handleOpenImageUpload(selectedProduct)}>
          <AddPhotoAlternate sx={{ mr: 1 }} /> Manage Images
        </MenuItem>
        <MenuItem onClick={() => handleManageStock(selectedProduct)}>
          <InventoryIcon sx={{ mr: 1 }} /> Manage Stock
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteProduct(selectedProduct?._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} /> Delete Product
        </MenuItem>
      </Menu>

      {/* Modals */}
      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editProduct ? "Edit Product" : "Add New Product"}
        maxWidth="lg"
      >
        <ProductForm
          initialData={editProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
          categories={categories}
        />
      </FormModal>

      {viewProduct && (
        <ProductViewModal
          open={openViewModal}
          onClose={() => setOpenViewModal(false)}
          product={viewProduct}
        />
      )}

      {selectedProduct && (
        <ImageUploadModal
          open={openImageUploadModal}
          onClose={() => setOpenImageUploadModal(false)}
          product={selectedProduct}
          onUploadSuccess={handleImageUploadSuccess}
        />
      )}

      {selectedProduct && (
        <VariantStockModal
          open={openVariantModal}
          onClose={() => setOpenVariantModal(false)}
          product={selectedProduct}
        />
      )}
    </Box>
  );
};

export default Products;
