import api from "./api";

export const productSizeMappingService = {
  // Get all size mappings
  getSizeMappings: async (params = {}) => {
    const response = await api.get("/product-size-mapping", { params }); // Fixed endpoint
    return response.data;
  },

  // Get single size mapping
  getSizeMapping: async (id) => {
    const response = await api.get(`/product-size-mapping/${id}`); // Fixed endpoint
    return response.data;
  },

  // Create size mapping
  createSizeMapping: async (data) => {
    const response = await api.post("/product-size-mapping", data); // Fixed endpoint
    return response.data;
  },

  // Update size mapping
  updateSizeMapping: async (id, data) => {
    const response = await api.put(`/product-size-mapping/${id}`, data); // Fixed endpoint
    return response.data;
  },

  // Delete size mapping
  deleteSizeMapping: async (id) => {
    const response = await api.delete(`/product-size-mapping/${id}`); // Fixed endpoint
    return response.data;
  },
};
