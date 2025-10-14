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
} from "@mui/icons-material";
import FormModal from "../components/Modals/FormModal";
import ProductForm from "../components/Forms/ProductForm";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

// **FIX:** Define the base URL to construct full image paths
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
      const response = await productService.getProducts({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearchTerm,
        category: filterCategory,
      });
      setProducts(response.data.products);
      setRowCount(response.data.pagination.total);
    } catch (error) {
      setError("Failed to load products. Please try again.");
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filterCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories({ limit: 100 });
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleAddProduct = () => {
    setEditProduct(null);
    setOpenModal(true);
  };
  const handleMenuClick = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleEditProduct = async (product) => {
    try {
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
      const response = await productService.getProduct(product._id);
      setViewProduct(response.data);
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
    if (window.confirm("Are you sure? This action is permanent.")) {
      try {
        await productService.deleteProduct(productId);
        toast.success("Product deleted!");
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
    handleMenuClose();
  };

  const handleFormSubmit = async (formData) => {
    const { image, ...productData } = formData;
    try {
      const response = editProduct
        ? await productService.updateProduct(editProduct._id, productData)
        : await productService.createProduct(productData);

      toast.success(`Product ${editProduct ? "updated" : "created"}!`);

      const productId = response.data._id;
      if (image) {
        const imageFormData = new FormData();
        imageFormData.append("image", image);
        await productService.uploadProductImage(productId, imageFormData);
        toast.success("Image uploaded!");
      }

      setOpenModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const columns = [
    {
      field: "images",
      headerName: "Image",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        const primaryImage =
          params.row.images?.find((img) => img.isPrimary) ||
          params.row.images?.[0];
        const imageUrl = primaryImage
          ? `${API_BASE_URL}${primaryImage.imageUrl}`
          : "";
        return (
          <Avatar
            src={imageUrl}
            variant="rounded"
            sx={{ width: 50, height: 50, bgcolor: "grey.200" }}
          >
            {params.row.icon || "📦"}
          </Avatar>
        );
      },
    },
    { field: "name", headerName: "Product Name", width: 250 },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      valueGetter: (value) => value?.name || "N/A",
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (params) => `₹${params.value.toLocaleString("en-IN")}`,
    },
    {
      field: "stock",
      headerName: "Stock",
      width: 120,
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
      field: "rating",
      headerName: "Rating",
      width: 120,
      renderCell: (params) => (
        <Rating value={params.value || 0} size="small" readOnly />
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
        <Alert severity="error">{error}</Alert>
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
          />
        </Box>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewProduct(selectedProduct)}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditProduct(selectedProduct)}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => handleOpenImageUpload(selectedProduct)}>
          <AddPhotoAlternate sx={{ mr: 1 }} /> Images
        </MenuItem>
        <MenuItem onClick={() => handleManageStock(selectedProduct)}>
          <InventoryIcon sx={{ mr: 1 }} /> Stock
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteProduct(selectedProduct?._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <FormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editProduct ? "Edit Product" : "Add Product"}
        maxWidth="md"
      >
        <ProductForm
          initialData={editProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setOpenModal(false)}
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
          onUploadSuccess={fetchProducts}
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
