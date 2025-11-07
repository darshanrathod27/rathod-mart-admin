// src/services/productColorMappingService.js
import api from "./api";

const API_URL = "/product-color-mapping";

/**
 * Backend list returns: { success, data: [...], pagination: {...} }
 * Normalize to { mappings, pagination } for the page.
 */
export const productColorMappingService = {
  async getColorMappings(params = {}) {
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

  async getColorMapping(id) {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data?.data;
  },

  async createColorMapping(payload) {
    const res = await api.post(API_URL, payload);
    return res.data?.data;
  },

  async updateColorMapping(id, payload) {
    const res = await api.put(`${API_URL}/${id}`, payload);
    return res.data?.data;
  },

  async deleteColorMapping(id) {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
  },
};
