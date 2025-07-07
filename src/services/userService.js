// src/services/addressService.js
import api from '../utils/axiosInstance';

// “My” addresses = only the logged‑in user’s
export const getMyAddresses = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  return api.get('/user/v1/addresses/', {
    params: { user_id: user.id },
  });
};

// Lookup ANY user’s addresses by their id
export const getAddressesByUserId = (userId) =>
  api.get('/user/v1/addresses/', {
    params: { user_id: userId },
  });

// Find a user by email
export const getUserByEmail = (email) =>
  api.get('/user/v1/users/', {
    params: { email },
  });
