import api from "./api";

export const productService = {
  // Get all products with pagination and filters
  getProducts: async (params = {}) => {
    try {
      console.log("📡 API Call: GET /products", params);
      const response = await api.get("/products", { params });
      console.log("✅ Products response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get products error:", error);
      throw error;
    }
  },

  // Get single product with full details including images
  getProduct: async (id) => {
    try {
      console.log("📡 API Call: GET /products/:id", id);
      const response = await api.get(`/products/${id}`);
      console.log("✅ Product details:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get product error:", error);
      throw error;
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      console.log("📡 API Call: POST /products", productData);
      const response = await api.post("/products", productData);
      console.log("✅ Product created:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Create product error:", error);
      throw error;
    }
  },

  // Update existing product
  updateProduct: async (id, productData) => {
    try {
      console.log("📡 API Call: PUT /products/:id", id, productData);
      const response = await api.put(`/products/${id}`, productData);
      console.log("✅ Product updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update product error:", error);
      throw error;
    }
  },

  // Delete product (soft delete)
  deleteProduct: async (id) => {
    try {
      console.log("📡 API Call: DELETE /products/:id", id);
      const response = await api.delete(`/products/${id}`);
      console.log("✅ Product deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Delete product error:", error);
      throw error;
    }
  },

  // Get product statistics
  getProductStats: async () => {
    try {
      console.log("📡 API Call: GET /products/stats");
      const response = await api.get("/products/stats");
      console.log("✅ Product stats:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get product stats error:", error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId, params = {}) => {
    try {
      console.log(
        "📡 API Call: GET /products/category/:id",
        categoryId,
        params
      );
      const response = await api.get(`/products/category/${categoryId}`, {
        params,
      });
      console.log("✅ Products by category:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get products by category error:", error);
      throw error;
    }
  },

  // Get all images for a product
  getProductImages: async (productId) => {
    try {
      console.log("📡 API Call: GET /products/:id/images", productId);
      const response = await api.get(`/products/${productId}/images`);
      console.log("✅ Product images:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get product images error:", error);
      throw error;
    }
  },

  // Upload product image
  uploadProductImage: async (productId, formData) => {
    try {
      console.log("📡 API Call: POST /products/:id/images", productId);
      const response = await api.post(
        `/products/${productId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ Image uploaded:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Upload product image error:", error);
      throw error;
    }
  },

  // Delete product image
  deleteProductImage: async (imageId) => {
    try {
      console.log("📡 API Call: DELETE /products/images/:id", imageId);
      const response = await api.delete(`/products/images/${imageId}`);
      console.log("✅ Image deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Delete product image error:", error);
      throw error;
    }
  },

  // Update product image (e.g., set as primary)
  updateProductImage: async (imageId, data) => {
    try {
      console.log("📡 API Call: PUT /products/images/:id", imageId, data);
      const response = await api.put(`/products/images/${imageId}`, data);
      console.log("✅ Image updated:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Update product image error:", error);
      throw error;
    }
  },
};
