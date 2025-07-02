import axiosInstance from '../utils/axiosInstance';

export const getAllCouriers = () => axiosInstance.get('/user/v1/users?user_type=supplier');
