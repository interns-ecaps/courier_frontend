// src/pages/panels/shipments/CreateShipment.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentForm from '../../../components/shipments/ShipmentForm';
import { createShipment } from '../../../services/shipmentService';
import { toast } from 'react-toastify';

const CreateShipment = () => {
  const navigate = useNavigate();

  const handleCreateShipment = async (formData) => {
    try {
      const response = await createShipment(formData);
      toast.success('Shipment created!');
      navigate(`/shipments/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create shipment');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create Shipment</h2>
      <ShipmentForm mode="create" onSubmit={handleCreateShipment} />
    </div>
  );
};

export default CreateShipment;
