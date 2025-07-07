import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllShipments, getShipmentById } from '../../../services/shipmentService';
import ShipmentDetailModal from '../../../components/shipments/ShipmentDetailModal';

const ShipmentList = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUserId, setFilterUserId] = useState(null);

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = JSON.parse(sessionStorage.getItem('user'));
  const userType = user?.user_type;
  const userId = user?.id;

  // Fetch shipments
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        let response;

        if (userType === 'super_admin') {
          const filters = filterUserId ? { user_id: filterUserId } : {};
          response = await getAllShipments(filters);
        } else {
          response = await getAllShipments({
            sender_id: userId,
            recipient_id: userId,
          });
        }

        setShipments(response.data.results || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load shipments.');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [filterUserId]);

  // Open modal if ?view=id is in URL
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) handleViewShipment(viewId);
  }, []);

  const handleViewShipment = async (id) => {
    try {
      const res = await getShipmentById(id);
      setSelectedShipment(res.data);
      setModalOpen(true);
      setSearchParams({ view: id });
    } catch (err) {
      console.error('Failed to load shipment details');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedShipment(null);
    setSearchParams({});
  };

  if (loading) return <p>Loading shipments...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Shipment List</h1>

      <button
        onClick={() => navigate('/shipments/create')}
        className="mb-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
      >
        Create New Shipment1
      </button>

      {userType === 'super_admin' && (
        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-700">Filter by User ID</label>
          <input
            type="number"
            placeholder="Enter User ID"
            className="border p-2 rounded w-1/2"
            onChange={(e) => setFilterUserId(e.target.value)}
          />
        </div>
      )}

      {shipments.length === 0 ? (
        <p>No shipments found.</p>
      ) : (
        <table className="min-w-full border text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Sender</th>
              <th className="border px-4 py-2">Receiver</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => {
              const isSender = shipment.sender_id === userId;
              const isRecipient = shipment.recipient_id === userId;

              return (
                <tr
                  key={shipment.id}
                  className={`hover:bg-orange-50 ${
                    isSender ? 'bg-green-50' : isRecipient ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="border px-4 py-2">{shipment.id}</td>
                  <td className="border px-4 py-2">{shipment.sender_name || 'N/A'}</td>
                  <td className="border px-4 py-2">{shipment.recipient_name || 'N/A'}</td>
                  <td className="border px-4 py-2">
                    {userType === 'super_admin'
                      ? '—'
                      : isSender
                      ? 'Sent'
                      : isRecipient
                      ? 'Received'
                      : '—'}
                  </td>
                  <td className="border px-4 py-2">{shipment.status || 'Pending'}</td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleViewShipment(shipment.id)}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/shipments/${shipment.id}/edit`)}
                      className="text-green-500 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {modalOpen && selectedShipment && (
        <ShipmentDetailModal shipment={selectedShipment} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default ShipmentList;
