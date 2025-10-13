import api from "./api";

export const userService = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get user stats
  getUserStats: async () => {
    const response = await api.get("/users/stats");
    return response.data;
  },
};
