// src/services/courierService.js
import api from '../utils/axiosInstance';

// Suppliers = users of type “supplier”
export const getAllCouriers = () =>
  api.get('/user/v1/users/', {
    params: { user_type: 'supplier' },
  });
