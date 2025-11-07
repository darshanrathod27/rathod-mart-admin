// src/services/productService.js
import api from "./api";

const API_URL = "/products";

class ProductService {
  // server: { success, data, pagination }
  async getProducts(params = {}) {
    const res = await api.get(API_URL, { params });
    return res.data; // { success, data, pagination }
  }

  async getProduct(id) {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data;
  }

  async createProduct(productData) {
    if (productData instanceof FormData) {
      const res = await api.post(API_URL, productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    }
    const res = await api.post(API_URL, productData);
    return res.data;
  }

  async updateProduct(id, productData) {
    if (productData instanceof FormData) {
      const res = await api.put(`${API_URL}/${id}`, productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    }
    const res = await api.put(`${API_URL}/${id}`, productData);
    return res.data;
  }

  async deleteProduct(id) {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
  }

  async uploadMultipleProductImages(productId, formData) {
    const res = await api.put(`${API_URL}/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  async getProductImages(productId) {
    const res = await this.getProduct(productId);
    return res.data?.images || [];
  }

  async deleteProductImage(productId, filename) {
    const res = await api.put(`${API_URL}/${productId}`, {
      deleteFilenames: [filename],
    });
    return res.data;
  }

  async setPrimaryImage(productId, filename) {
    const res = await api.put(`${API_URL}/${productId}/images/primary`, {
      filename,
    });
    return res.data;
  }

  async recalculateStock(productId) {
    const res = await api.put(`${API_URL}/${productId}/recalculate-stock`);
    return res.data;
  }

  async getProductVariants(productId) {
    const res = await api.get(`${API_URL}/${productId}/variants`);
    return res.data;
  }
}

export const productService = new ProductService();
