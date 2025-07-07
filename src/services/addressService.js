import api from '../utils/axiosInstance';

export const getAddressesByUserId = (userId) =>
  api.get('/user/v1/addresses/', { params: { user_id: userId } });

export const getMyAddresses = () => api.get('/user/v1/addresses/');

export const getAddressesByUser = (userId) => api.get(`/user/v1/addresses/${userId}`);

export const createAddress = async (addressData) => {
  const response = await api.post("/user/v1/create_address", addressData);
  return response.data;
};

// PUT (replace entire address)
export const updateAddress = async (addressId, updatedData) => {
  const response = await api.put(`/user/v1/replace_address/${addressId}`, updatedData);
  return response.data;
};

// PATCH (update specific fields)
export const patchAddress = async (addressId, patchData) => {
  const response = await api.patch(`/user/v1/update_address/${addressId}`, patchData);
  return response.data;
};