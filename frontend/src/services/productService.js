// frontend/src/services/productService.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/products`;

class ProductService {
  // Get all products with enhanced filtering
  async getProducts(params = {}) {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  // Get single product with images
  async getProduct(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }

  // Create new product
  async createProduct(productData) {
    try {
      const response = await axios.post(API_URL, productData, {
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
      const response = await axios.put(`${API_URL}/${id}`, productData, {
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
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Upload single product image
  async uploadProductImage(productId, formData) {
    try {
      const response = await axios.post(
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
      const response = await axios.post(
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
      const response = await axios.get(`${API_URL}/${productId}/images`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product images:", error);
      throw error;
    }
  }

  // Update product image
  async updateProductImage(imageId, updateData) {
    try {
      const response = await axios.put(
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
      const response = await axios.delete(`${API_URL}/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting product image:", error);
      throw error;
    }
  }

  // Get product statistics
  async getProductStats() {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product stats:", error);
      throw error;
    }
  }
}

export const productService = new ProductService();
