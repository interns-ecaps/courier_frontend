// src/services/shipmentService.js

import axiosInstance from '../utils/axiosInstance';

export const getAllShipments = async () => {
  try {
    const response = await axiosInstance.get('/shipment/v1/shipments/');
    return response.data;
  } catch (error) {
    console.error('Error fetching shipments:', error);
    throw error;
  }
};


export const getShipmentById = async (id) => {
  return await axiosInstance.get(`/shipment/v1/shipments/${id}`);
};

export const createShipment = async (data) => {
  return await axiosInstance.post('/shipment/v1/create_shipment/', data);
};

export const updateShipment = async (id, data) => {
  return await axiosInstance.patch(`/shipment/v1/update_shipment/${id}`, data);
};

export const updateShipmentTrackerStatus = async (id, data) => {
  return await axiosInstance.post(`/shipment/v1/shipments/${id}/accept_reject/`, data);
};

export const updateShipmentStatus = async (shipmentId, payload) => {
  return await axiosInstance.patch(`/shipment/v1/update_shipment/${shipmentId}`, payload);
};

export const acceptShipment = async (shipmentId) => {
  try {
    console.log('Sending accept request for shipment:', shipmentId);
    const response = await axiosInstance.post(`/shipment/v1/shipments/${shipmentId}/accept_reject/`, {
      action: "accept"
    });
    console.log('Accept response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error accepting shipment:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const rejectShipment = async (shipmentId) => {
  try {
    console.log('Sending reject request for shipment:', shipmentId);
    const response = await axiosInstance.post(`/shipment/v1/shipments/${shipmentId}/accept_reject/`, {
      action: "reject"
    });
    console.log('Reject response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const cancelShipment = async (shipmentId) => {
  return await axiosInstance.post(`/shipment/v1/cancel_shipment/${shipmentId}`);
};

