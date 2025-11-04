// frontend/src/services/productService.js
import api from "./api"; // <-- IMPORT YOUR CUSTOM API

const API_URL = "/products"; // <-- Use the relative path

class ProductService {
  // Get all products with enhanced filtering
  async getProducts(params = {}) {
    try {
      const response = await api.get(API_URL, { params });
      return response.data; // <-- This will now work with your interceptor
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  // Get single product with images
  async getProduct(id) {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }

  // Create new product
  async createProduct(productData) {
    try {
      const response = await api.post(API_URL, productData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // Update product
  async updateProduct(id, productData) {
    try {
      const response = await api.put(`${API_URL}/${id}`, productData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  // Delete product
  async deleteProduct(id) {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Upload single product image
  async uploadProductImage(productId, formData) {
    try {
      const response = await api.post(
        `${API_URL}/${productId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  // Upload multiple product images
  async uploadMultipleProductImages(productId, formData) {
    try {
      const response = await api.post(
        `${API_URL}/${productId}/images/multiple`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      throw error;
    }
  }

  // Get product images
  async getProductImages(productId) {
    try {
      const response = await api.get(`${API_URL}/${productId}/images`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product images:", error);
      throw error;
    }
  }

  // Update product image
  async updateProductImage(imageId, updateData) {
    try {
      const response = await api.put(
        `${API_URL}/images/${imageId}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating product image:", error);
      throw error;
    }
  }

  // Delete product image
  async deleteProductImage(imageId) {
    try {
      const response = await api.delete(`${API_URL}/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting product image:", error);
      throw error;
    }
  }

  // Get product statistics
  async getProductStats() {
    try {
      const response = await api.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product stats:", error);
      throw error;
    }
  }
}

export const productService = new ProductService();
