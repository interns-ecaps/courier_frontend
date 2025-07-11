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
    // <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <ShipmentForm mode="create" onSubmit={handleCreateShipment} user={user} />
    // </div>
  );
};

export default CreateShipment;
