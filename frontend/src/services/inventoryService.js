// src/services/inventoryService.js
import api from "./api";

export const inventoryService = {
  addStock: async (data) => {
    const res = await api.post("/inventory/add-stock", data);
    // server will return ledger entry in res.data.data (likely)
    try {
      // dispatch a global event so UI can auto-refresh
      if (typeof window !== "undefined") {
        const pid =
          (res?.data && res.data.data && res.data.data.product) ||
          (res?.data && res.data.product) ||
          null;
        window.dispatchEvent(
          new CustomEvent("inventory:updated", { detail: { productId: pid } })
        );
      }
    } catch (e) {
      // ignore
    }
    return res.data;
  },
  reduceStock: async (data) => {
    const res = await api.post("/inventory/reduce-stock", data);
    try {
      if (typeof window !== "undefined") {
        const pid =
          (res?.data && res.data.data && res.data.data.product) ||
          (res?.data && res.data.product) ||
          null;
        window.dispatchEvent(
          new CustomEvent("inventory:updated", { detail: { productId: pid } })
        );
      }
    } catch (e) {
      // ignore
    }
    return res.data;
  },
  getInventoryLedger: async (params = {}) => {
    const res = await api.get("/inventory/ledger", { params });
    return res.data?.data || res.data || {};
  },
  getProductVariants: async (productId) => {
    const res = await api.get(`/inventory/product-variants/${productId}`);
    // res.data may be { success, data: [...] }
    return res.data?.data || [];
  },
  getStockSummary: async (productId) => {
    const res = await api.get(`/inventory/stock-summary/${productId}`);
    return res.data?.data || {};
  },
  getInventoryStats: async () => {
    const res = await api.get("/inventory/stats");
    return res.data?.data || {};
  },
};
