// src/pages/shipments/CreateShipment.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createShipment } from '../../services/shipmentService';
import { getMyAddresses } from '../../services/addressService';
import { getMyPackages } from '../../services/packageService';
import { getAllCouriers } from '../../services/userService';

const CreateShipment = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    recipient_email: '',
    pickup_address_id: '',
    delivery_address_id: '',
    courier_id: '',
    shipment_type: 'standard',
    package_id: '',
    pickup_date: '',
    special_instructions: '',
    insurance_required: false,
    signature_required: false,
  });
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [addrRes, pkgRes, courierRes] = await Promise.all([
          getMyAddresses(),
          getMyPackages(),
          getAllCouriers(),
        ]);
        setPickupAddresses(addrRes.data.results);
        setPackages(pkgRes.data.results);
        setCouriers(courierRes.data.results);
      } catch (err) {
        console.error(err);
        setError('Failed to load form data.');
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createShipment(form);
      navigate(`/shipments/${response.data.id}`);
    } catch (err) {
      console.error(err);
      setError('Shipment creation failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create Shipment</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="recipient_email"
          placeholder="Recipient Email"
          value={form.recipient_email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <select
          name="pickup_address_id"
          value={form.pickup_address_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Pickup Address</option>
          {pickupAddresses.map((addr) => (
            <option key={addr.id} value={addr.id}>
              {addr.address_line}, {addr.city}
            </option>
          ))}
        </select>

        <select
          name="delivery_address_id"
          value={form.delivery_address_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Delivery Address</option>
          {pickupAddresses.map((addr) => (
            <option key={addr.id} value={addr.id}>
              {addr.address_line}, {addr.city}
            </option>
          ))}
        </select>

        <select
          name="courier_id"
          value={form.courier_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Courier</option>
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>
              {courier.first_name} {courier.last_name}
            </option>
          ))}
        </select>

        <select
          name="package_id"
          value={form.package_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.description} ({pkg.weight}kg)
            </option>
          ))}
        </select>

        <select
          name="shipment_type"
          value={form.shipment_type}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="standard">Standard</option>
          <option value="express">Express</option>
        </select>

        <input
          type="date"
          name="pickup_date"
          value={form.pickup_date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="special_instructions"
          value={form.special_instructions}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="Special instructions"
        ></textarea>

        <label className="block">
          <input
            type="checkbox"
            name="insurance_required"
            checked={form.insurance_required}
            onChange={handleChange}
            className="mr-2"
          />
          Insurance Required
        </label>

        <label className="block">
          <input
            type="checkbox"
            name="signature_required"
            checked={form.signature_required}
            onChange={handleChange}
            className="mr-2"
          />
          Signature Required
        </label>

        <button type="submit" className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600">
          Create Shipment
        </button>
      </form>
    </div>
  );
};

export default CreateShipment;
