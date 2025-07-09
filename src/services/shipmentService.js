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
export const updateShipment = (id, data) => axiosInstance.put(`/shipment/v1/shipments/${id}`, data);

// Update only the status of a shipment by ID
export const updateShipmentStatus = (id, data) => axiosInstance.put(`/shipment/v1/shipments/${id}/status/`, data);

// Update the tracker/status of a shipment by ID
export const updateShipmentTrackerStatus = (id, data) => axiosInstance.post(`/shipment/v1/shipments/${id}/tracker/`, data);

// Delete a shipment by ID
export const deleteShipment = (id) => axiosInstance.delete(`/shipments/${id}`);

// Accept a shipment by ID
export const acceptShipment = (id) => axiosInstance.post(`/shipment/v1/shipments/${id}/accept/`);

// Reject a shipment by ID
export const rejectShipment = (id) => axiosInstance.post(`/shipment/v1/shipments/${id}/reject/`);

// Cancel a shipment by ID
export const cancelShipment = (id) => axiosInstance.post(`/shipment/v1/shipments/${id}/cancel/`);
