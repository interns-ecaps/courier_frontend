import api from '../utils/axiosInstance';


export const update_address = (id, data) => {
  return api.patch(`/user/v1/update_address/{address_id}`, data);
};

export const getAddressesByUserId = (userId) =>
  api.get('/user/v1/addresses/', { params: { user_id: userId } });

export const getMyAddresses = () => api.get('/user/v1/addresses/');

export const getAddressesByUser = (userId) => api.get(`/user/v1/addresses/${userId}`);

export const createAddress = async (addressData) => {
  const response = await api.post("/user/v1/create_address", addressData);
  return response.data;
};

// PUT (replace entire address)
export const updateAddress = async (addressId, updatedData) => {
  const response = await api.put(`/user/v1/replace_address/${addressId}`, updatedData);
  return response.data;
};

// PATCH (update specific fields)
export const patchAddress = async (addressId, patchData) => {
  const response = await api.patch(`/user/v1/update_address/${addressId}`, patchData);
  return response.data;
};

// Fetch a single address by its address ID
export const getAddressById = (addressId) => api.get(`/user/v1/address/${addressId}`);

// Replace getCountries with improved version
export const getCountries = async () => {
  try {
    console.log('Fetching countries from API...');
    const response = await api.get('/user/v1/countries/', {
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