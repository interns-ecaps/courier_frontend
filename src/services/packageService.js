// src/services/packageService.js
import api from '../utils/axiosInstance';

// Only this user’s packages
export const getMyPackages = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  return api.get('/shipment/v1/packages/', {
    params: { user_id: user.id },
  });
};

export const createPackage = async (data) => {
  return await api.post('/shipment/v1/create_package/', data);
};

export const getPackageById = async (id) => {
  return await api.get(`/shipment/v1/packages/${id}`);
};

export const updatePackage = async (id, data) => {
  return await api.patch(`/shipment/v1/packages/${id}`, data);
};