// src/pages/panels/shipments/CreateShipment.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentForm from '../../../components/shipments/ShipmentForm';
import { createShipment } from '../../../services/shipmentService';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'react-feather';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-auto relative">
      {/* Remove SVG wave background and truck icon from header */}
      <div className="w-full max-w-5xl h-auto min-h-[80vh] flex flex-col justify-center bg-white/80 rounded-3xl shadow-2xl border-4 border-transparent bg-clip-padding p-4 sm:p-8 mt-0 relative z-10 animate-fadeInUp" style={{ boxShadow: '0 12px 48px 0 rgba(249,115,22,0.15), 0 1.5px 8px 0 rgba(31,38,135,0.07)' }}>
        {/* Header Bar - matches View Shipment */}
        <div className="flex items-center gap-3 px-4 sm:px-8 py-4 sm:py-5 bg-orange-500 rounded-2xl shadow-lg mb-4">
          <button onClick={() => navigate(-1)} className="text-white hover:text-orange-100 transition" aria-label="Back to shipments list"><ArrowLeft size={22} /></button>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex-1 drop-shadow">Create Shipment</h2>
        </div>
        {/* Stepper is rendered by ShipmentForm, so no need to duplicate here */}
        <div className="flex-1 flex flex-col justify-center overflow-visible">
          <ShipmentForm mode="create" onSubmit={handleCreateShipment} user={user} />
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;
