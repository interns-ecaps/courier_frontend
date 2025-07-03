import api from '../utils/axiosInstance';

export const getMyAddresses = () => api.get('/user/v1/addresses/');

export const getAddressesByUserId = (userId) =>
  api.get('/user/v1/addresses/', { params: { user_id: userId } });

export const getUserByEmail = (email) =>
  api.get('/user/v1/users/', { params: { email } });
