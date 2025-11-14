// frontend/src/services/promocodeService.js
import api from "./api";

const API_URL = "/promocodes";

export const promocodeService = {
  async getPromocodes(params = {}) {
    const res = await api.get(API_URL, { params });
    return res.data; // { success, data, pagination }
  },

  async getPromocode(id) {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data; // { success, data }
  },

  async createPromocode(payload) {
    const res = await api.post(API_URL, payload);
    return res.data;
  },

  async updatePromocode(id, payload) {
    const res = await api.put(`${API_URL}/${id}`, payload);
    return res.data;
  },

  async deletePromocode(id) {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
  },
};
