// src/services/shipmentService.js
import axiosInstance from '../utils/axiosInstance';
// Get all shipments
export const getAllShipments = (params = {}) => {
  return axiosInstance.get('/shipment/v1/shipments/', { params });
};

export const getShipmentById = (id) => {
  return axiosInstance.get(`/shipment/v1/shipments/${id}`);
};

// Create a new shipment
export const createShipment = (data) => {
  return axiosInstance.post('/shipment/v1/shipments/', data);
};


// Update a shipment by ID
export const updateShipment = (id, data) => axios.put(`/shipments/${id}`, data);

// Delete a shipment by ID
export const deleteShipment = (id) => axios.delete(`/shipments/${id}`);
