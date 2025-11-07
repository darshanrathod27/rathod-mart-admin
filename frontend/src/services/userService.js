import api from "./api";

export const getUsers = async (params, signal) => {
  const res = await api.get("/users", { params, signal });
  return res.data;
};

export const getUserById = async (id, signal) => {
  const res = await api.get(`/users/${id}`, { signal });
  return res.data;
};

export const createUser = async (payload) => {
  if (payload instanceof FormData) {
    const res = await api.post("/users", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
  const res = await api.post("/users", payload);
  return res.data;
};

export const updateUser = async (id, payload) => {
  if (payload instanceof FormData) {
    const res = await api.put(`/users/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
  const res = await api.put(`/users/${id}`, payload);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};
