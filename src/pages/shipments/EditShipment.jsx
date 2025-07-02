import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ShipmentForm from '../../components/shipments/ShipmentForm';
import { getShipmentById, updateShipment } from '../../services/shipmentService';
import { toast } from 'react-toastify';

const EditShipment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Edit Shipment</h2>
      <ShipmentForm mode="update" initialValues={shipmentData} onSubmit={handleUpdate} />
    </div>
  );
};

export default EditShipment;
