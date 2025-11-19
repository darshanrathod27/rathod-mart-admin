// frontend/src/pages/Products.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem as MItem,
  Typography,
  Tooltip,
  Stack,
} from "@mui/material";
import { Rating } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Visibility,
  Delete,
  Image as ImageIcon,
  Inventory,
  FilterList,
  Clear,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import ProductForm from "../components/Forms/ProductForm";
import FormModal from "../components/Modals/FormModal";
import ProductViewModal from "../components/Modals/ProductViewModal";
import ImageUploadModal from "../components/Modals/ImageUploadModal";
import VariantStockModal from "../components/Modals/VariantStockModal";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { useDebounce } from "../hooks/useDebounce";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

export default function Products() {
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  // Pagination - Using paginationModel as per DataGrid best practices
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Sorting
  const [sortModel, setSortModel] = useState([
    { field: "createdAt", sort: "desc" },
  ]);

  // ✅ ADVANCED SEARCH - Searches name, brand, description, price
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [imageModalProduct, setImageModalProduct] = useState(null);
  const [openVariantModal, setOpenVariantModal] = useState(false);
  const [variantProduct, setVariantProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // ✅ Fetch Products with Advanced Search
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch, // ✅ Searches name, brand, description, price
        category: filterCategory,
        status: filterStatus,
        sortBy: sortModel[0]?.field || "createdAt",
        sortOrder: sortModel[0]?.sort || "desc",
      };

      const resp = await productService.getProducts(params);

      if (resp.success) {
        const rows = resp.data || [];
        const mapped = rows.map((r) => {
          // Process images with full URLs
          const images = (r.images || []).map((img) => ({
            ...img,
            fullImageUrl:
              img.fullUrl ||
              img.fullImageUrl ||
              (img.url ? `${API_BASE_URL}${img.url}` : img.imageUrl),
          }));

          return {
            ...r,
            images,
            totalStock: r.stock ?? r.totalStock ?? 0,
            stock: r.stock ?? r.totalStock ?? 0,
          };
        });

        setProducts(mapped);
        setTotalRows(resp.pagination?.total || 0);
      }
    } catch (e) {
      console.error("Fetch products error:", e);
      toast.error(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [
    paginationModel,
    debouncedSearch,
    filterCategory,
    filterStatus,
    sortModel,
  ]);

  // ✅ Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getCategories({
        limit: 200,
        status: "active",
      });
      setCategories(res.data?.categories || res.data || []);
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Listen for inventory updates
  useEffect(() => {
    const handleInventoryUpdate = () => {
      fetchProducts();
    };

    window.addEventListener("inventory:updated", handleInventoryUpdate);
    return () => {
      window.removeEventListener("inventory:updated", handleInventoryUpdate);
    };
  }, [fetchProducts]);

  // ✅ Clear All Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterStatus("");
    setPaginationModel({ page: 0, pageSize: 10 });
  };

  // ✅ Get Image URL Helper
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.fullImageUrl) return img.fullImageUrl;
    if (img.fullUrl) return img.fullUrl;
    if (img.url)
      return img.url.startsWith("http") ? img.url : `${API_BASE_URL}${img.url}`;
    return null;
  };

  // ✅ Menu Handlers
  const openMenu = (event, row) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  // ✅ Create/Update Product
  const handleCreateOrUpdate = async (formData, { isEdit, id }) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await productService.updateProduct(id, formData);
        toast.success("Product updated successfully");
        await fetchProducts();
      } else {
        await productService.createProduct(formData);
        toast.success("Product created successfully");
        // Reset to page 0 after creation
        if (paginationModel.page !== 0) {
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
        } else {
          await fetchProducts();
        }
      }
      setOpenForm(false);
      setEditProduct(null);
    } catch (e) {
      console.error("Save product error:", e);
      toast.error(e.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Open Edit Modal
  const handleOpenEdit = async (row) => {
    closeMenu();
    try {
      const resp = await productService.getProduct(row._id);
      setEditProduct(resp.data);
      setOpenForm(true);
    } catch (err) {
      console.error("Load product error:", err);
      toast.error("Failed to load product");
    }
  };

  // ✅ View Product Details
  const handleView = async (row) => {
    closeMenu();
    try {
      const resp = await productService.getProduct(row._id);
      const p = resp.data;
      p.images = (p.images || []).map((img) => ({
        ...img,
        fullImageUrl: getImageUrl(img),
      }));
      setViewProduct(p);
    } catch (err) {
      console.error("View product error:", err);
      toast.error("Failed to load product");
    }
  };

  // ✅ Manage Images
  const handleOpenImages = (row) => {
    setImageModalProduct(row);
    setOpenImageModal(true);
    closeMenu();
  };

  // ✅ Manage Variants/Stock
  const handleOpenVariants = (row) => {
    setVariantProduct(row);
    setOpenVariantModal(true);
    closeMenu();
  };

  // ✅ Delete Product
  const handleDelete = async (row) => {
    closeMenu();
    if (!window.confirm("Delete this product? This action cannot be undone."))
      return;

    try {
      await productService.deleteProduct(row._id);
      toast.success("Product deleted successfully");
      await fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      toast.error(err.message || "Delete failed");
    }
  };

  // ✅ DataGrid Columns
  const columns = [
    {
      field: "images",
      headerName: "Image",
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const images = params.value || [];
        const primary = images.find((i) => i.isPrimary) || images[0];
        const src = primary ? getImageUrl(primary) : null;
        return (
          <Tooltip title={`${images.length} image(s)`}>
            <Avatar
              src={src}
              variant="rounded"
              sx={{
                width: 64,
                height: 64,
                bgcolor: "grey.200",
                border: "2px solid",
                borderColor: "grey.300",
              }}
            >
              <ImageIcon sx={{ fontSize: 28, color: "grey.600" }} />
            </Avatar>
          </Tooltip>
        );
      },
    },
    {
      field: "name",
      headerName: "Product",
      flex: 1,
      minWidth: 260,
      renderCell: (params) => {
        const categoryLabel =
          params.row.category?.name || params.row.category || "Uncategorized";
        return (
          <Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}
              noWrap
              title={params.value}
            >
              {params.value}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Chip
                size="small"
                label={categoryLabel}
                variant="outlined"
                sx={{ textTransform: "capitalize", fontWeight: 600 }}
              />
              {params.row.brand && (
                <Typography variant="caption" color="text.secondary">
                  {params.row.brand}
                </Typography>
              )}
            </Stack>
          </Box>
        );
      },
    },
    {
      field: "brand",
      headerName: "Brand",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2">{p.value || "-"}</Typography>
      ),
    },
    {
      field: "shortDescription",
      headerName: "Description",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              whiteSpace: "normal",
            }}
          >
            {params.value || "—"}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "basePrice",
      headerName: "Price",
      width: 110,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          ₹{(p.value || 0).toLocaleString("en-IN")}
        </Typography>
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Rating
          value={params.row.rating || 0}
          readOnly
          precision={0.5}
          size="small"
        />
      ),
    },
    {
      field: "stock",
      headerName: "Stock",
      width: 100,
      renderCell: (params) => {
        const stockCount = params.row.stock ?? params.row.totalStock ?? 0;
        return (
          <Chip
            label={stockCount}
            size="small"
            color={
              stockCount > 10 ? "success" : stockCount > 0 ? "warning" : "error"
            }
            onClick={(e) => {
              e.stopPropagation();
              setVariantProduct(params.row);
              setOpenVariantModal(true);
            }}
            sx={{ cursor: "pointer", fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (p) => {
        const colorMap = {
          active: "success",
          draft: "warning",
          inactive: "default",
          archived: "error",
        };
        return (
          <Chip
            label={p.value}
            color={colorMap[p.value] || "default"}
            size="small"
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      renderCell: (params) => {
        const date = params.row.createdAt || params.row.updatedAt;
        if (!date) return <Typography variant="caption">-</Typography>;
        try {
          return (
            <Typography variant="caption">
              {new Date(date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Typography>
          );
        } catch {
          return <Typography variant="caption">-</Typography>;
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton onClick={(e) => openMenu(e, params.row)} size="small">
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* Search and Filters Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Search Bar - Searches name, brand, description, price */}
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search by name, brand, description, or price (e.g., 200)..."
                size="small"
                sx={{ flex: 1 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm("")}
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                {showFilters ? "Hide" : "Show"} Filters
              </Button>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditProduct(null);
                  setOpenForm(true);
                }}
              >
                Add Product
              </Button>
            </Stack>

            {/* Clear Filters Button */}
            {(searchTerm || filterCategory || filterStatus) && (
              <Button
                variant="text"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                size="small"
                sx={{ alignSelf: "flex-start" }}
              >
                Clear All Filters
              </Button>
            )}

            {/* Filter Options */}
            {showFilters && (
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* DataGrid Card */}
      <Card>
        <Box sx={{ width: "100%" }}>
          <DataGrid
            rows={products}
            columns={columns}
            getRowId={(r) => r._id}
            rowCount={totalRows}
            pagination
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50, 100]}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            loading={loading}
            disableRowSelectionOnClick
            rowHeight={110}
            sx={{
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          />
        </Box>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MItem onClick={() => handleView(menuRow)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MItem>
        <MItem onClick={() => handleOpenEdit(menuRow)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Product
        </MItem>
        <MItem onClick={() => handleOpenImages(menuRow)}>
          <ImageIcon sx={{ mr: 1 }} fontSize="small" />
          Manage Images
        </MItem>
        <MItem onClick={() => handleOpenVariants(menuRow)}>
          <Inventory sx={{ mr: 1 }} fontSize="small" />
          Manage Stock
        </MItem>
        <MItem
          onClick={() => handleDelete(menuRow)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MItem>
      </Menu>

      {/* Product Form Modal */}
      <FormModal
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditProduct(null);
        }}
        title={editProduct ? "Edit Product" : "Add New Product"}
        maxWidth="lg"
      >
        <ProductForm
          initialData={editProduct}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setOpenForm(false);
            setEditProduct(null);
          }}
          categories={categories}
          submitting={submitting}
          embedded={true}
        />
      </FormModal>

      {/* Product View Modal */}
      {viewProduct && (
        <ProductViewModal
          open={Boolean(viewProduct)}
          onClose={() => setViewProduct(null)}
          product={viewProduct}
          onEdit={(prod) => {
            setViewProduct(null);
            handleOpenEdit(prod);
          }}
          onManageStock={(prod) => {
            setViewProduct(null);
            setVariantProduct(prod);
            setOpenVariantModal(true);
          }}
        />
      )}

      {/* Image Upload Modal */}
      {openImageModal && imageModalProduct && (
        <ImageUploadModal
          open={openImageModal}
          onClose={() => {
            setOpenImageModal(false);
            setImageModalProduct(null);
          }}
          product={imageModalProduct}
          onUploadSuccess={() => fetchProducts()}
        />
      )}

      {/* Variant Stock Modal */}
      {variantProduct && (
        <VariantStockModal
          open={openVariantModal}
          onClose={() => {
            setOpenVariantModal(false);
            setVariantProduct(null);
          }}
          product={variantProduct}
          onSaved={() => fetchProducts()}
        />
      )}
    </Box>
  );
}
