// src/services/packageService.js
import api from '../utils/axiosInstance';

// Only this user’s packages
export const getMyPackages = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  return api.get('/shipment/v1/packages/', {
    params: { user_id: user.id },
  });
};

// Fetch a package by its ID
export const getPackageById = (packageId) => {
  return api.get(`/shipment/v1/packages/${packageId}/`);
};
