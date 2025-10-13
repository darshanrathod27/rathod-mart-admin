import api from "./api";

export const productColorMappingService = {
  // Get all color mappings
  getColorMappings: async (params = {}) => {
    const response = await api.get("/product-color-mapping", { params }); // Fixed endpoint
    return response.data;
  },

  // Get single color mapping
  getColorMapping: async (id) => {
    const response = await api.get(`/product-color-mapping/${id}`); // Fixed endpoint
    return response.data;
  },

  // Create color mapping
  createColorMapping: async (data) => {
    const response = await api.post("/product-color-mapping", data); // Fixed endpoint
    return response.data;
  },

  // Update color mapping
  updateColorMapping: async (id, data) => {
    const response = await api.put(`/product-color-mapping/${id}`, data); // Fixed endpoint
    return response.data;
  },

  // Delete color mapping
  deleteColorMapping: async (id) => {
    const response = await api.delete(`/product-color-mapping/${id}`); // Fixed endpoint
    return response.data;
  },
};
