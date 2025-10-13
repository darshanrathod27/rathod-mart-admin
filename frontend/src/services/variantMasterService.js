import api from "./api";

export const variantMasterService = {
  // Get all variants
  getVariants: async (params = {}) => {
    const response = await api.get("/variant-master", { params }); // Fixed endpoint
    return response.data;
  },

  // Get single variant
  getVariant: async (id) => {
    const response = await api.get(`/variant-master/${id}`); // Fixed endpoint
    return response.data;
  },

  // Create variant
  createVariant: async (data) => {
    const response = await api.post("/variant-master", data); // Fixed endpoint
    return response.data;
  },

  // Update variant
  updateVariant: async (id, data) => {
    const response = await api.put(`/variant-master/${id}`, data); // Fixed endpoint
    return response.data;
  },

  // Delete variant
  deleteVariant: async (id) => {
    const response = await api.delete(`/variant-master/${id}`); // Fixed endpoint
    return response.data;
  },

  // Get variants by product
  getVariantsByProduct: async (productId) => {
    const response = await api.get(`/variant-master/product/${productId}`); // Fixed endpoint
    return response.data;
  },
};
