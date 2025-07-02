import { jwtDecode } from 'jwt-decode';

export const getToken = () => sessionStorage.getItem('accessToken');

export const isAuthenticated = () => !!getToken();

export const logout = () => {
  sessionStorage.clear();
};

export const validateToken = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now();
    return now < decoded.exp * 1000;
  } catch {
    return false;
  }
};