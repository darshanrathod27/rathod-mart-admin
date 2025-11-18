// src/services/categoryService.js
import api from "./api";

/**
 * categoryService
 * Wrapper around API calls for categories.
 * All functions return `res.data` (which should be in the shape your backend returns).
 */
export const categoryService = {
  /**
   * List categories with optional query params:
   * params: { page, limit, search, status, sortBy, sortOrder, dateFrom, dateTo, ... }
   */
  getCategories: async (params = {}) => {
    const res = await api.get("/categories", { params });
    return res.data;
  },

  /** Get single category by id */
  getCategory: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },

  /** Create a new category */
  createCategory: async (payload) => {
    const res = await api.post("/categories", payload);
    return res.data;
  },

  /** Update a category by id */
  updateCategory: async (id, payload) => {
    const res = await api.put(`/categories/${id}`, payload);
    return res.data;
  },

  /** Soft-delete a category by id */
  deleteCategory: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },

  /** Admin utility: fix icons/colors for all categories */
  fixCategoryIcons: async () => {
    const res = await api.get("/categories/admin/fix-icons");
    return res.data;
  },
};

export default categoryService;
