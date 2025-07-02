// src/services/addressService.js

import axiosInstance from '../utils/axiosInstance';

export const getMyAddresses = async () => {
  const response = await axiosInstance.get('/user/v1/addresses');
  return response.data.results;
};

export const getAddressesByUser = (userId) => axiosInstance.get(`/user/v1/addresses/${userId}`);
