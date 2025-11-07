import api from "./api";

export const categoryService = {
  getCategories: async (params = {}) => {
    const res = await api.get("/categories", { params });
    // backend returns: { success, data, pagination }
    return res.data;
  },

  getCategory: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },

  createCategory: async (payload) => {
    const res = await api.post("/categories", payload);
    return res.data;
  },

  updateCategory: async (id, payload) => {
    const res = await api.put(`/categories/${id}`, payload);
    return res.data;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};
