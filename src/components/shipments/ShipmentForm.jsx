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
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    if (onSubmit) {
      await onSubmit(form);
    }
    setSubmitting(false);
  };

  const disabled = readOnly;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {error && <p className="text-red-500 text-center font-semibold mb-2">{error}</p>}

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Recipient Email</label>
        <input
          type="email"
          name="recipient_email"
          placeholder="Recipient Email"
          value={form.recipient_email}
          onChange={handleChange}
          className="w-full rounded-full border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
          disabled={disabled}
          required={mode === 'create'}
        />
      </div>

      {/* Pickup Address */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Pickup Address</label>
        <select
          name="pickup_address_id"
          value={form.pickup_address_id}
          onChange={handleChange}
          className="w-full rounded-full border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
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
      </div>

      {/* Delivery Address */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Delivery Address</label>
        <select
          name="delivery_address_id"
          value={form.delivery_address_id}
          onChange={handleChange}
          className="w-full rounded-full border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
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
      </div>

      {/* Courier */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Courier</label>
        <select
          name="courier_id"
          value={form.courier_id}
          onChange={handleChange}
          className="w-full rounded-full border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
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
      </div>

      {/* Package */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Package</label>
        <select
          name="package_id"
          value={form.package_id}
          onChange={handleChange}
          className="w-full rounded-full border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
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
      </div>

      {/* Shipment Type */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Shipment Type</label>
        <select
          name="shipment_type"
          value={form.shipment_type}
          onChange={handleChange}
          className="w-full rounded-full border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
          disabled={disabled}
        >
          <option value="standard">Standard</option>
          <option value="express">Express</option>
          <option value="overnight">Overnight</option>
          <option value="same_day">Same Day</option>
        </select>
      </div>

      {/* Pickup Date */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Pickup Date</label>
        <input
          type="datetime-local"
          name="pickup_date"
          value={form.pickup_date}
          onChange={handleChange}
          className="w-full rounded-full border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
          disabled={disabled}
          required
        />
      </div>

      {/* Special Instructions */}
      <div className="flex flex-col gap-1">
        <label className="text-orange-700 font-semibold text-sm mb-1">Special Instructions</label>
        <textarea
          name="special_instructions"
          value={form.special_instructions}
          onChange={handleChange}
          className="w-full rounded-2xl border border-orange-200 px-5 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none min-h-[60px]"
          disabled={disabled}
          placeholder="Any notes for the courier or recipient?"
        />
      </div>

      {/* Insurance & Signature */}
      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2 text-orange-700 font-semibold">
          <input
            type="checkbox"
            name="insurance_required"
            checked={form.insurance_required}
            onChange={handleChange}
            className="accent-orange-500 w-5 h-5"
            disabled={disabled}
          />
          Insurance Required
        </label>
        <label className="flex items-center gap-2 text-orange-700 font-semibold">
          <input
            type="checkbox"
            name="signature_required"
            checked={form.signature_required}
            onChange={handleChange}
            className="accent-orange-500 w-5 h-5"
            disabled={disabled}
          />
          Signature Required
        </label>
      </div>

      <button
        type="submit"
        className="w-full mt-4 py-3 rounded-full bg-orange-500 text-white font-bold text-lg shadow hover:bg-orange-600 transition disabled:opacity-60"
        disabled={disabled || submitting}
      >
        {submitting ? 'Creating...' : 'Create Shipment'}
      </button>
    </form>
  );
};

export default ShipmentForm;
