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
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error detail:", error.response?.data?.detail);
      let errorMessage = 'Failed to create shipment';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => err.msg || err).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl bg-white border border-orange-100 p-0 sm:p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500 text-3xl font-bold shadow-lg">🚚</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent tracking-tight flex-1">
              Create New Shipment
            </h2>
          </div>
          <div className="text-gray-600 text-lg mt-2 mb-2">Fill in the details below to create a new shipment. All fields are required unless marked optional.</div>
        </div>
        {/* Form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-8">
          <ShipmentForm mode="create" onSubmit={handleCreateShipment} user={user} />
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;
