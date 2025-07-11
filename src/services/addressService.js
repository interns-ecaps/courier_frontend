import axiosInstance from '../utils/axiosInstance';


export const update_address = (id, data) => {
  return axiosInstance.patch(`/user/v1/update_address/{address_id}`, data);
};

export const getAddressesByUserId = (userId) =>
  axiosInstance.get('/user/v1/addresses/', { params: { user_id: userId } });

export const getMyAddresses = () => axiosInstance.get('/user/v1/addresses/');

export const getAddressesByUser = (userId) => axiosInstance.get(`/user/v1/addresses/${userId}`);

export const getAddressById = (addressId) =>
  axiosInstance.get(`/user/v1/addresses/${addressId}`);

export const createAddress = async (addressData) => {
  const response = await axiosInstance.post("/user/v1/create_address", addressData);
  return response.data;
};

// PUT (replace entire address)
export const updateAddress = async (addressId, updatedData) => {
  const response = await axiosInstance.put(`/user/v1/replace_address/${addressId}`, updatedData);
  return response.data;
};

// PATCH (update specific fields)
export const patchAddress = async (addressId, patchData) => {
  const response = await axiosInstance.patch(`/user/v1/update_address/${addressId}`, patchData);
  return response.data;
};

// Add this new function to fetch countries
export const getCountries = async () => {
  try {
    console.log('Fetching countries from API...');
    const response = await axiosInstance.get('/user/v1/countries/', {
      params: {
        page: 1,
        limit: 1000 // Request a large limit to get all countries
      }
    });
    console.log('Countries response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    throw error;
  }
};