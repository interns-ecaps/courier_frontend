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
  // Use the general update endpoint for status changes like IN_TRANSIT, DELIVERED, etc.
  const payload = {
    status_type: data.action
  };
  
  console.log('DEBUG: Sending status update request:', {
    shipmentId: id,
    payload: payload,
    endpoint: `/shipment/v1/update_shipment/${id}`
  });
  
  try {
    const response = await axiosInstance.patch(`/shipment/v1/update_shipment/${id}`, payload);
    console.log('DEBUG: Status update response:', response.data);
    return response;
  } catch (error) {
    console.error('DEBUG: Status update error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const updateShipmentStatus = async (shipmentId, payload) => {
  return await axiosInstance.patch(`/shipment/v1/update_shipment/${shipmentId}`, payload);
};

export const updateShipmentStatusByStatusId = async (statusId, newStatus) => {
  // Build the payload based on the status being updated
  let payload = {
    status: newStatus
  };

  // Add additional fields based on the status
  switch (newStatus) {
    case "IN_TRANSIT":
      payload.current_location = "In Transit";
      break;
    case "DELIVERED":
      payload.current_location = "Customer Address";
      payload.is_delivered = true;
      break;
    case "ACCEPTED":
      payload.current_location = "Warehouse";
      break;
    case "PENDING":
      payload.current_location = "Pending Pickup";
      break;
    default:
      payload.current_location = "Unknown Location";
  }

  console.log('DEBUG: Sending status update request:', {
    statusId: statusId,
    payload: payload,
    endpoint: `/shipment/v1/update_status/${statusId}`
  });

  try {
    const response = await axiosInstance.patch(`/shipment/v1/update_status/${statusId}`, payload);
    console.log('DEBUG: Status update response:', response.data);
    return response;
  } catch (error) {
    console.error('DEBUG: Status update error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
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

// Pay for a shipment
export const payForShipment = (shipmentId) =>
  axiosInstance.post('/shipment/v1/create_payment/', { shipment_id: shipmentId });

