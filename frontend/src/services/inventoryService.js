import api from "./api";

export const inventoryService = {
  // Add stock to inventory (Purchase)
  addStock: async (data) => {
    const response = await api.post("/inventory/add-stock", data);
    return response.data;
  },

  // Reduce stock from inventory (Sale)
  reduceStock: async (data) => {
    const response = await api.post("/inventory/reduce-stock", data);
    return response.data;
  },

  // Get inventory ledger with filters
  getInventoryLedger: async (params = {}) => {
    const response = await api.get("/inventory/ledger", { params });
    return response.data;
  },

  // Get product variants with current stock
  getProductVariants: async (productId) => {
    const response = await api.get(`/inventory/product-variants/${productId}`);
    return response.data;
  },

  // Get stock summary for a product
  getStockSummary: async (productId, variantId = null) => {
    const response = await api.get(`/inventory/stock-summary/${productId}`, {
      params: { variantId },
    });
    return response.data;
  },

  // Get inventory stats
  getInventoryStats: async () => {
    const response = await api.get("/inventory/stats");
    return response.data;
  },
};
