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
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
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
  Clear,
  Warning,
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
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Delete Confirmation Component ---
const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemName }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Warning color="error" /> Confirm Deletion
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete product <strong>{itemName}</strong>?
        This action cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} variant="outlined" color="inherit">
        Cancel
      </Button>
      <Button onClick={onConfirm} variant="contained" color="error">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default function Products() {
  // --- State Management ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // For dropdown
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  // Pagination & Sorting
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState([
    { field: "createdAt", sort: "desc" },
  ]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [imageModalProduct, setImageModalProduct] = useState(null);
  const [openVariantModal, setOpenVariantModal] = useState(false);
  const [variantProduct, setVariantProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Menus
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // --- Helpers ---
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.fullImageUrl) return img.fullImageUrl;
    if (img.fullUrl) return img.fullUrl;
    if (img.url)
      return img.url.startsWith("http") ? img.url : `${API_BASE_URL}${img.url}`;
    return null;
  };

  // --- Data Fetching ---

  // 1. Fetch Categories for Filter Dropdown
  useEffect(() => {
    const loadCats = async () => {
      try {
        // Removing strict status filter to ensure all categories load for filtering
        const res = await categoryService.getCategories({ limit: 1000 });
        // Ensure we extract the array correctly (handle different API response shapes)
        const list = Array.isArray(res?.data) ? res.data : res || [];
        setCategories(list);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    loadCats();
  }, []);

  // 2. Fetch Products Table Data
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: debouncedSearch,
        // If filterCategory is an object (from Autocomplete), use _id
        category: filterCategory ? filterCategory._id || filterCategory.id : "",
        status: filterStatus,
        sortBy: sortModel[0]?.field || "createdAt",
        sortOrder: sortModel[0]?.sort || "desc",
      };

      const resp = await productService.getProducts(params);

      if (resp.success) {
        const rows = resp.data || [];
        const mapped = rows.map((r) => {
          const images = (r.images || []).map((img) => ({
            ...img,
            fullImageUrl: getImageUrl(img),
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
      toast.error("Failed to load products");
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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Handlers ---

  const openMenu = (event, row) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const handleCreateOrUpdate = async (formData, { isEdit, id }) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await productService.updateProduct(id, formData);
        toast.success("Product updated");
      } else {
        await productService.createProduct(formData);
        toast.success("Product created");
        if (paginationModel.page !== 0)
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }
      setOpenForm(false);
      setEditProduct(null);
      fetchProducts();
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (row) => {
    setProductToDelete(row);
    setDeleteDialogOpen(true);
    closeMenu();
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.deleteProduct(productToDelete._id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleOpenEdit = async (row) => {
    closeMenu();
    try {
      const resp = await productService.getProduct(row._id);
      setEditProduct(resp.data);
      setOpenForm(true);
    } catch (err) {
      toast.error("Failed to load product");
    }
  };

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
      toast.error("Failed to load product");
    }
  };

  // --- DataGrid Columns ---
  const columns = [
    {
      field: "images",
      headerName: "Image",
      width: 70,
      sortable: false,
      renderCell: (params) => {
        const images = params.value || [];
        const primary = images.find((i) => i.isPrimary) || images[0];
        const src = primary ? primary.fullImageUrl : null;
        return (
          <Avatar
            src={src}
            variant="rounded"
            sx={{ width: 40, height: 40, bgcolor: "grey.200" }}
          >
            <ImageIcon sx={{ fontSize: 20, color: "grey.500" }} />
          </Avatar>
        );
      },
    },
    {
      field: "name",
      headerName: "Product",
      flex: 1,
      minWidth: 240,
      renderCell: (params) => {
        const categoryLabel =
          params.row.category?.name || params.row.category || "Uncategorized";
        return (
          <Box>
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              title={params.value}
            >
              {params.value}
            </Typography>
            {/* Removed duplicate Brand text from here */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={categoryLabel}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            </Stack>
          </Box>
        );
      },
    },
    {
      field: "brand",
      headerName: "Brand",
      width: 120,
      renderCell: (p) => (
        <Typography variant="body2">{p.value || "-"}</Typography>
      ),
    },
    {
      field: "shortDescription",
      headerName: "Description",
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              whiteSpace: "normal",
              lineHeight: "1.2em",
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
      width: 100,
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
      width: 90,
      renderCell: (p) => (
        <Chip
          label={p.value}
          size="small"
          color={p.value > 10 ? "success" : p.value > 0 ? "warning" : "error"}
          onClick={(e) => {
            e.stopPropagation();
            setVariantProduct(p.row);
            setOpenVariantModal(true);
          }}
          sx={{ cursor: "pointer", fontWeight: 600, height: 24 }}
        />
      ),
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
            sx={{ textTransform: "capitalize" }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 110,
      renderCell: (params) => (
        <Typography variant="caption">
          {params.row.createdAt
            ? new Date(params.row.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })
            : "-"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 70,
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
      {/* --- Header Control --- */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <TextField
              placeholder="Search product, brand..."
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

            {/* Advanced Category Filter */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 220 }}
              options={categories}
              getOptionLabel={(option) => option.name || ""}
              value={filterCategory}
              onChange={(event, newValue) => setFilterCategory(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter Category"
                  placeholder="Select category"
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
            />

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
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
              </Select>
            </FormControl>

            {/* Add Button */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditProduct(null);
                setOpenForm(true);
              }}
              sx={{ whiteSpace: "nowrap", height: 40 }}
            >
              Add Product
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* --- Data Table --- */}
      <Card>
        <DataGrid
          rows={products}
          columns={columns}
          getRowId={(r) => r._id}
          rowCount={totalRows}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          loading={loading}
          disableRowSelectionOnClick
          rowHeight={70}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "rgba(76, 175, 80, 0.05)",
            },
            "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
          }}
        />
      </Card>

      {/* --- Menus & Modals --- */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MItem onClick={() => handleView(menuRow)}>
          <Visibility sx={{ mr: 1, fontSize: 20 }} /> View
        </MItem>
        <MItem onClick={() => handleOpenEdit(menuRow)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} /> Edit
        </MItem>
        <MItem
          onClick={() => {
            setImageModalProduct(menuRow);
            setOpenImageModal(true);
            closeMenu();
          }}
        >
          <ImageIcon sx={{ mr: 1, fontSize: 20 }} /> Images
        </MItem>
        <MItem
          onClick={() => {
            setVariantProduct(menuRow);
            setOpenVariantModal(true);
            closeMenu();
          }}
        >
          <Inventory sx={{ mr: 1, fontSize: 20 }} /> Stock
        </MItem>
        <MItem
          onClick={() => confirmDelete(menuRow)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete
        </MItem>
      </Menu>

      <FormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editProduct ? "Edit Product" : "Add New Product"}
        maxWidth="lg"
      >
        <ProductForm
          initialData={editProduct}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setOpenForm(false)}
          categories={categories}
          submitting={submitting}
          embedded={true}
        />
      </FormModal>

      {viewProduct && (
        <ProductViewModal
          open={Boolean(viewProduct)}
          onClose={() => setViewProduct(null)}
          product={viewProduct}
        />
      )}
      {openImageModal && (
        <ImageUploadModal
          open={openImageModal}
          onClose={() => setOpenImageModal(false)}
          product={imageModalProduct}
          onUploadSuccess={fetchProducts}
        />
      )}
      {variantProduct && (
        <VariantStockModal
          open={openVariantModal}
          onClose={() => setOpenVariantModal(false)}
          product={variantProduct}
          onSaved={fetchProducts}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemName={productToDelete?.name}
      />
    </Box>
  );
}
