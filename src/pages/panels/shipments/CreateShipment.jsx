// src/pages/panels/shipments/CreateShipment.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentForm from '../../../components/shipments/ShipmentForm';
import { createShipment } from '../../../services/shipmentService';
import { toast } from 'react-toastify';

const CreateShipment = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleCreateShipment = async (formData) => {
    if (!user) return;
    const shipmentData = {
      ...formData
    };
    console.log("Sending shipment data:", shipmentData);
    try {
      const response = await createShipment(shipmentData);
      toast.success('Shipment created!');
      navigate(`/shipments/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create shipment');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col justify-center bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-orange-100 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500 text-3xl font-bold shadow-lg">🚚</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex-1">Create New Shipment</h2>
        </div>
        <div className="mb-8 text-gray-600 text-lg">Fill in the details below to create a new shipment. All fields are required unless marked optional.</div>
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <ShipmentForm mode="create" onSubmit={handleCreateShipment} user={user} />
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;
