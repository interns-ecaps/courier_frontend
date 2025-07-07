// src/components/shipments/ShipmentForm.jsx
import React, { useEffect, useState } from 'react';
import { getMyAddresses } from '../../services/addressService'; // update the path as per your project structure
import { getMyPackages } from '../../services/packageService'; // update the path as per your project structure
import { getAllCouriers } from '../../services/courierService'; // update the path as per your project structure

const ShipmentForm = ({
  mode = 'create',             // 'create', 'update', 'replace', or 'view'
  initialValues = {},          // initial data for edit/view
  onSubmit,                    // submit handler (create/update/replace)
  readOnly = false,            // for view-only mode
}) => {
  const [form, setForm] = useState({
    recipient_email: '',
    pickup_address_id: '',
    delivery_address_id: '',
    courier_id: '',
    shipment_type: 'standard',
    package_id: '',
    pickup_date: '',
    delivery_date: '',
    estimated_delivery: '',
    special_instructions: '',
    insurance_required: false,
    signature_required: false,
    ...initialValues, // Override defaults with incoming values
  });

  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Replace these with your actual API service calls
        const [addrRes, pkgRes, courierRes] = await Promise.all([
          getMyAddresses(),
          getMyPackages(),
          getAllCouriers(),
        ]);
        setPickupAddresses(addrRes.data.results);
        setPackages(pkgRes.data.results);
        setCouriers(courierRes.data.results);

        // Also set delivery addresses if recipient data exists in initialValues
        if (initialValues.recipient_id) {
          const delRes = await getAddressesByUser(initialValues.recipient_id);
          setDeliveryAddresses(delRes.data.results);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load form data.');
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(form);
    }
  };

  const disabled = readOnly;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}

      {/* Email */}
      <input
        type="email"
        name="recipient_email"
        placeholder="Recipient Email"
        value={form.recipient_email}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
        required={mode === 'create'}
      />

      {/* Pickup Address */}
      <select
        name="pickup_address_id"
        value={form.pickup_address_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
        required
      >
        <option value="">Select Pickup Address</option>
        {pickupAddresses.map((addr) => (
          <option key={addr.id} value={addr.id}>
            {addr.address_line}, {addr.city}
          </option>
        ))}
      </select>

      {/* Delivery Address */}
      <select
        name="delivery_address_id"
        value={form.delivery_address_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
        required
      >
        <option value="">Select Delivery Address</option>
        {deliveryAddresses.map((addr) => (
          <option key={addr.id} value={addr.id}>
            {addr.address_line}, {addr.city}
          </option>
        ))}
      </select>

      {/* Courier */}
      <select
        name="courier_id"
        value={form.courier_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
        required
      >
        <option value="">Select Courier</option>
        {couriers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.first_name} {c.last_name}
          </option>
        ))}
      </select>

      {/* Package */}
      <select
        name="package_id"
        value={form.package_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
        required
      >
        <option value="">Select Package</option>
        {packages.map((pkg) => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.package_type} ({pkg.weight}kg)
          </option>
        ))}
      </select>

      {/* Shipment Type */}
      <select
        name="shipment_type"
        value={form.shipment_type}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
      >
        <option value="standard">Standard</option>
        <option value="express">Express</option>
        <option value="overnight">Overnight</option>
        <option value="same_day">Same Day</option>
      </select>

      {/* Dates */}
      <input
        type="datetime-local"
        name="pickup_date"
        value={form.pickup_date}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
        required
      />
      {(mode === 'replace' || mode === 'view') && (
        <>
          <input
            type="datetime-local"
            name="delivery_date"
            value={form.delivery_date}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            disabled={disabled}
          />
          <input
            type="datetime-local"
            name="estimated_delivery"
            value={form.estimated_delivery}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            disabled={disabled}
          />
        </>
      )}

      {/* Instructions */}
      <textarea
        name="special_instructions"
        value={form.special_instructions}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        disabled={disabled}
        placeholder="Special instructions"
      />

      {/* Flags */}
      <label className="block">
        <input
          type="checkbox"
          name="insurance_required"
          checked={form.insurance_required}
          onChange={handleChange}
          disabled={disabled}
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
          disabled={disabled}
          className="mr-2"
        />
        Signature Required
      </label>

      {!readOnly && (
        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
        >
          {mode === 'update' ? 'Update Shipment' : mode === 'replace' ? 'Replace Shipment' : 'Create Shipment'}
        </button>
      )}
    </form>
  );
};

export default ShipmentForm;
