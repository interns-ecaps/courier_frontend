import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ShipmentForm from '../../components/shipments/ShipmentForm';
import { getShipmentById } from '../../services/shipmentService';
import { toast } from 'react-toastify';

const ViewShipment = () => {
  const { id } = useParams();
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getShipmentById(id);
        setShipmentData(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load shipment');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Shipment Details</h2>
      <ShipmentForm mode="view" initialValues={shipmentData} readOnly />
    </div>
  );
};

export default ViewShipment;
