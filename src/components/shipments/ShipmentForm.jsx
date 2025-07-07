// src/components/shipments/ShipmentForm.jsx
import React, { useEffect, useState } from 'react';
import {
  getMyAddresses,
  getAddressesByUserId,
  // getUserByEmail,
} from '../../services/addressService';
import { getMyPackages } from '../../services/packageService';
import { getAllCouriers } from '../../services/courierService';
import {getUserByEmail} from '../../services/userService';
import { toast } from 'react-toastify';

const ShipmentForm = ({
  mode = 'create',
  initialValues = {},
  onSubmit,
  readOnly = false,
}) => {
  // 1) form state
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
    ...initialValues,
  });

  // 2) dropdown data
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [error, setError] = useState('');

  // ─── 3) Fetch your pickup addresses, your packages, and all couriers once ───────────
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [addrRes, pkgRes, courierRes] = await Promise.all([
          getMyAddresses(),
          getMyPackages(),
          getAllCouriers(),
        ]);

        setPickupAddresses(addrRes.data.results || []);
        setPackages(pkgRes.data.results || []);
        setCouriers(courierRes.data.results || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load initial form data.');
      }
    };
    fetchInitial();
  }, []); // ← static, never changes

  // ─── 4) Whenever recipient_email changes, fetch that user's addresses ────────────────
  useEffect(() => {
    // skip on mount or if unchanged
    if (
      !form.recipient_email ||
      form.recipient_email === initialValues.recipient_email
    ) return;

    const fetchRecipient = async () => {
      try {
        const userRes = await getUserByEmail(form.recipient_email);
        const recipient = userRes.data.results?.[0];
        if (recipient?.id) {
          const addrRes = await getAddressesByUserId(recipient.id);
          setDeliveryAddresses(addrRes.data.results || []);
        } else {
          setDeliveryAddresses([]);
        }
      } catch {
        console.error('Failed to fetch recipient addresses');
        setDeliveryAddresses([]);
      }
    };
    fetchRecipient();
  }, [form.recipient_email, initialValues.recipient_email]); // ← static length 2

  // ─── 5) Handlers ────────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      try {
        await onSubmit(form);
      } catch (err) {
        toast.error('Submission failed');
      }
    }
  };

  const disabled = readOnly;

  // ─── 6) Render ─────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}

      {/* Recipient Email */}
      <input
        type="email"
        name="recipient_email"
        placeholder="Recipient Email"
        value={form.recipient_email}
        onChange={handleChange}
        disabled={disabled}
        required={mode === 'create'}
        className="w-full border p-2 rounded"
      />

      {/* Pickup Address */}
      <select
        name="pickup_address_id"
        value={form.pickup_address_id}
        onChange={handleChange}
        disabled={disabled}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select Pickup Address</option>
        {pickupAddresses.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label || `${a.address_line}, ${a.city}`}
          </option>
        ))}
      </select>

      {/* Delivery Address */}
      <select
        name="delivery_address_id"
        value={form.delivery_address_id}
        onChange={handleChange}
        disabled={disabled}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select Delivery Address</option>
        {deliveryAddresses.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label || `${a.address_line}, ${a.city}`}
          </option>
        ))}
      </select>

      {/* Courier */}
      <select
        name="courier_id"
        value={form.courier_id}
        onChange={handleChange}
        disabled={disabled}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select Courier</option>
        {couriers.map((c) => (
          <option key={c.id} value={c.id}>
            {`${c.first_name} ${c.last_name}`}
          </option>
        ))}
      </select>

      {/* Package */}
      <select
        name="package_id"
        value={form.package_id}
        onChange={handleChange}
        disabled={disabled}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select Package</option>
        {packages.map((p) => (
          <option key={p.id} value={p.id}>
            {`${p.description} (${p.weight}kg)`}
          </option>
        ))}
      </select>

      {/* Shipment Type */}
      <select
        name="shipment_type"
        value={form.shipment_type}
        onChange={handleChange}
        disabled={disabled}
        className="w-full border p-2 rounded"
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
        disabled={disabled}
        required
        className="w-full border p-2 rounded"
      />
      {(mode === 'replace' || mode === 'view') && (
        <>
          <input
            type="datetime-local"
            name="delivery_date"
            value={form.delivery_date}
            onChange={handleChange}
            disabled={disabled}
            className="w-full border p-2 rounded"
          />
          <input
            type="datetime-local"
            name="estimated_delivery"
            value={form.estimated_delivery}
            onChange={handleChange}
            disabled={disabled}
            className="w-full border p-2 rounded"
          />
        </>
      )}

      {/* Instructions */}
      <textarea
        name="special_instructions"
        value={form.special_instructions}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Special instructions"
        className="w-full border p-2 rounded"
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
          {mode === 'update'
            ? 'Update Shipment'
            : mode === 'replace'
            ? 'Replace Shipment'
            : 'Create Shipment'}
        </button>
      )}
    </form>
  );
};

export default ShipmentForm;
