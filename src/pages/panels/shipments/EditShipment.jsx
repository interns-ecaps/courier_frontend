// src/pages/panels/shipments/EditShipment.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ShipmentForm from '../../../components/shipments/ShipmentForm';
import { getShipmentById, updateShipment } from '../../../services/shipmentService';
import { getPackageById } from '../../../services/packageService';
import { toast } from 'react-toastify';

const EditShipment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getShipmentById(id);
        const shipment = res.data;
        console.log('Fetched shipment for edit:', shipment);
        let packageData = {};
        if (shipment.package) {
          packageData = {
            package_type: shipment.package.type,
            weight: shipment.package.weight,
            length: shipment.package.length,
            width: shipment.package.width,
            height: shipment.package.height,
            is_negotiable: shipment.package.is_negotiable,
            currency_id: shipment.package.currency_id, // FIXED: use currency_id
            final_cost: shipment.package.final_cost,
            package_id: shipment.package.id, // ADD THIS LINE
          };
        }
        // Ensure delivery_address_text is always present for the form
        let deliveryData = {};
        if (!('delivery_address_text' in shipment)) {
          deliveryData.delivery_address_text = '';
        }
        setShipmentData({ ...shipment, ...packageData, ...deliveryData });
      } catch (error) {
        console.error(error);
        toast.error('Failed to load shipment');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (updatedData) => {
    try {
      await updateShipment(id, updatedData);
      toast.success('Shipment updated!');
      navigate(`/shipments/${id}`);
    } catch (error) {
      console.error(error);
      toast.error('Update failed');
    }
  };

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 overflow-auto">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col justify-center bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-orange-100 overflow-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500 text-3xl font-bold shadow-lg">✏️</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex-1">Edit Shipment</h2>
        </div>
        <div className="mb-8 text-gray-600 text-lg">Update the details below and save your changes. All fields are required unless marked optional.</div>
        <div className="flex-1 flex flex-col justify-center overflow-auto">
          <ShipmentForm mode="update" initialValues={shipmentData} onSubmit={handleUpdate} user={user} />
        </div>
      </div>
    </div>
  );
};

export default EditShipment;
