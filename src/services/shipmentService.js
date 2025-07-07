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


export const updateShipmentStatus = async (shipmentId, payload) => {
  return await axiosInstance.patch(`/shipments/${shipmentId}/`, payload);
};

