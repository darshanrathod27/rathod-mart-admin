// src/services/productSizeMappingService.js
import api from "./api";

const API_URL = "/product-size-mapping";

/**
 * Backend list response shape:
 * { success: true, data: [...], pagination: { page, limit, total, pages } }
 * We normalize to { mappings, pagination } so the rest of the app can stay the same.
 */
export const productSizeMappingService = {
  async getSizeMappings(params = {}) {
    const res = await api.get(API_URL, { params });
    const data = Array.isArray(res.data?.data) ? res.data.data : [];
    const pagination = res.data?.pagination || {
      page: 1,
      limit: data.length,
      total: data.length,
      pages: 1,
    };
    return { mappings: data, pagination };
  },

  async getSizeMapping(id) {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data?.data;
  },

  async createSizeMapping(payload) {
    const res = await api.post(API_URL, payload);
    return res.data?.data;
  },

  async updateSizeMapping(id, payload) {
    const res = await api.put(`${API_URL}/${id}`, payload);
    return res.data?.data;
  },

  async deleteSizeMapping(id) {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
  },
};
