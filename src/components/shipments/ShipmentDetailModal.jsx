// src/components/shipments/ShipmentDetailModal.jsx
import React from 'react';

const ShipmentDetailModal = ({ shipment, onClose }) => {
  if (!shipment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] md:w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Shipment #{shipment.id}</h2>

        <div className="mb-2">
          <strong>Sender:</strong> {shipment.sender_name || 'N/A'}
        </div>
        <div className="mb-2">
          <strong>Recipient:</strong> {shipment.recipient_name || 'N/A'}
        </div>
        <div className="mb-2">
          <strong>Status:</strong> {shipment.status || 'Pending'}
        </div>
        <div className="mb-2">
          <strong>Created At:</strong>{' '}
          {shipment.created_at ? new Date(shipment.created_at).toLocaleString() : 'N/A'}
        </div>

        {/* More fields if needed */}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShipmentDetailModal;
