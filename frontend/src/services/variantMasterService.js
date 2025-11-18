// src/services/variantMasterService.js
import api from "./api";

const API_URL = "/variant-master";

export const variantMasterService = {
  async getVariants(params = {}) {
    const res = await api.get(API_URL, { params });
    const data = res.data?.data;
    const variants = Array.isArray(data?.variants)
      ? data.variants
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];
    const pagination = data?.pagination ||
      res.data?.pagination || {
        page: 1,
        limit: variants.length,
        total: variants.length,
        pages: 1,
      };
    return { variants, pagination };
  },

  async getVariant(id) {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data?.data;
  },

  async createVariant(payload) {
    const res = await api.post(API_URL, payload);
    return res.data;
  },

  async updateVariant(id, payload) {
    const res = await api.put(`${API_URL}/${id}`, payload);
    return res.data;
  },

  async deleteVariant(id) {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
  },

  async getVariantsByProduct(productId) {
    const res = await api.get(`${API_URL}/product/${productId}`);
    return res.data?.data || [];
  },
};
