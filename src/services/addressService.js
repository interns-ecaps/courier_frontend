// src/services/addressService.js

import axiosInstance from '../utils/axiosInstance';

export const getMyAddresses = async () => {
  const response = await axiosInstance.get('/user/v1/addresses');
  return response.data.results;
};

export const getAddressesByUser = (userId) => axiosInstance.get(`/user/v1/addresses/${userId}`);

export const createAddress = async (addressData) => {
  const response = await axiosInstance.post("/user/v1/create_address", addressData);
  return response.data;
};


// PUT (replace entire address)
export const updateAddress = async (addressId, updatedData) => {
  const response = await axiosInstance.put(`/user/v1/replace_address/${addressId}`, updatedData);
  return response.data;
};

// PATCH (update specific fields)
export const patchAddress = async (addressId, patchData) => {
  const response = await axiosInstance.patch(`/user/v1/update_address/${addressId}`, patchData);
  return response.data;
};
