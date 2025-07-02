import axiosInstance from '../utils/axiosInstance';

export const getMyPackages = () => axiosInstance.get('/shipment/v1/packages');
