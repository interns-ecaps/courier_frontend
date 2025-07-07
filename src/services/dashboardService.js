import axiosInstance from '../utils/axiosInstance';

export const getDashboardData = async () => {
  console.log('DashboardService baseURL:', axiosInstance.defaults.baseURL);
  return axiosInstance.get('/user/v1/dashboard');
}; 