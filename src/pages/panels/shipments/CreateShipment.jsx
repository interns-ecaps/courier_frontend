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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 py-10 px-2">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-orange-100 p-10 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-orange-700 mb-2">Create Shipment</h2>
        <p className="text-orange-400 mb-8 text-base font-medium">Fill in the details below to create a new shipment</p>
        <ShipmentForm mode="create" onSubmit={handleCreateShipment} />
      </div>
    </div>
  );
};

export default CreateShipment;
