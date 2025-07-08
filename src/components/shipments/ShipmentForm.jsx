// src/components/shipments/ShipmentForm.jsx
import React, { useEffect, useState } from 'react';
import {
  getMyAddresses,
  getAddressesByUserId,
} from '../../services/addressService';
import { getMyPackages } from '../../services/packageService';
import { getAllCouriers } from '../../services/courierService';
import { toast } from 'react-toastify';

const steps = [
  'Sender',
  'Recipient',
  'Package',
  'Supplier',
  'Shipment Details',
  'Review',
];

const ShipmentForm = ({
  mode = 'create',
  initialValues = {},
  onSubmit,
  readOnly = false,
  user = null,
}) => {
  const [form, setForm] = useState({
    pickup_address_id: '',
    delivery_address_text: '',
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    courier_id: '',
    shipment_type: 'standard',
    package_id: '',
    pickup_date: '',
    special_instructions: '',
    insurance_required: false,
    signature_required: false,
    ...initialValues,
  });
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState({});

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
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        return true; // Sender is always filled
      case 1:
        return (
          form.delivery_address_text &&
          form.recipient_name &&
          form.recipient_email &&
          form.recipient_phone
        );
      case 2:
        return !!form.package_id;
      case 3:
        return !!form.courier_id;
      case 4:
        return form.pickup_address_id && form.pickup_date;
      default:
        return true;
    }
  };

  const handleNext = (e) => {
    e && e.preventDefault();
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
      setError('');
    } else {
      setError('Please fill all required fields for this step.');
    }
  };

  const handleBack = (e) => {
    e && e.preventDefault();
    setStep((s) => Math.max(s - 1, 0));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      try {
        const {
          pickup_address_id,
          delivery_address_text,
          recipient_name,
          recipient_email,
          recipient_phone,
          courier_id,
          shipment_type,
          package_id,
          pickup_date,
          special_instructions,
          insurance_required,
          signature_required,
        } = form;
        await onSubmit({
          pickup_address_id: pickup_address_id ? parseInt(pickup_address_id, 10) : undefined,
          delivery_address_text,
          recipient_name,
          recipient_email,
          recipient_phone,
          courier_id: courier_id ? parseInt(courier_id, 10) : undefined,
          shipment_type,
          package_id: package_id ? parseInt(package_id, 10) : undefined,
          pickup_date,
          special_instructions,
          insurance_required: !!insurance_required,
          signature_required: !!signature_required,
        });
      } catch (err) {
        toast.error('Submission failed');
      }
    }
  };

  const disabled = readOnly;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((label, idx) => (
          <React.Fragment key={label}>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg ${step === idx ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500 border border-orange-300'}`}>{idx + 1}</div>
            {idx < steps.length - 1 && <div className="w-8 h-1 bg-orange-200 rounded" />}
          </React.Fragment>
        ))}
      </div>
      {error && <p className="text-red-500 mb-2 text-center">{error}</p>}
      <div className="flex-1 flex flex-col justify-center">
        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded border">
              <div className="mb-2 font-semibold">Sender Details</div>
              <input value={user?.first_name + ' ' + user?.last_name} readOnly className="w-full border p-2 rounded mb-2 bg-gray-100" />
              <input value={user?.email} readOnly className="w-full border p-2 rounded mb-2 bg-gray-100" />
            </div>
            <button type="button" onClick={handleNext} className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600">Next: Recipient</button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              name="delivery_address_text"
              placeholder="Delivery Address"
              value={form.delivery_address_text}
              onChange={handleChange}
              disabled={disabled}
              required
              className="w-full border p-2 rounded mb-2"
            />
            <input
              type="text"
              name="recipient_name"
              placeholder="Recipient Name"
              value={form.recipient_name}
              onChange={handleChange}
              disabled={disabled}
              required
              className="w-full border p-2 rounded mb-2"
            />
            <input
              type="email"
              name="recipient_email"
              placeholder="Recipient Email"
              value={form.recipient_email}
              onChange={handleChange}
              disabled={disabled}
              required
              className="w-full border p-2 rounded mb-2"
            />
            <input
              type="text"
              name="recipient_phone"
              placeholder="Recipient Phone"
              value={form.recipient_phone}
              onChange={handleChange}
              disabled={disabled}
              required
              className="w-full border p-2 rounded mb-2"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">Back</button>
              <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600">Next: Package</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
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
            <div className="flex gap-2">
              <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">Back</button>
              <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600">Next: Supplier</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <select
              name="courier_id"
              value={form.courier_id}
              onChange={handleChange}
              disabled={disabled}
              required
              className="w-full border p-2 rounded"
            >
              <option value="">Select Supplier</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.first_name} ${c.last_name}`}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">Back</button>
              <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600">Next: Shipment Details</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <select
              name="pickup_address_id"
              value={form.pickup_address_id}
              onChange={handleChange}
              disabled={disabled}
              required
              className="w-full border p-2 rounded mb-2"
            >
              <option value="">Select Pickup Address</option>
              {pickupAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || `${a.address_line}, ${a.city}`}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              name="pickup_date"
              value={form.pickup_date}
              onChange={handleChange}
              disabled={disabled}
              required
              className="w-full border p-2 rounded mb-2"
            />
            {/* Allow supplier to edit estimated_delivery */}
            {user?.user_type === 'supplier' && (
              <input
                type="datetime-local"
                name="estimated_delivery"
                value={form.estimated_delivery || ''}
                onChange={handleChange}
                className="w-full border p-2 rounded mb-2"
                required
              />
            )}
            <select
              name="shipment_type"
              value={form.shipment_type}
              onChange={handleChange}
              disabled={disabled}
              className="w-full border p-2 rounded mb-2"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="overnight">Overnight</option>
              <option value="same_day">Same Day</option>
            </select>
            <textarea
              name="special_instructions"
              value={form.special_instructions}
              onChange={handleChange}
              disabled={disabled}
              placeholder="Special instructions"
              className="w-full border p-2 rounded"
            />
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
            <div className="flex gap-2">
              <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">Back</button>
              <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600">Next: Review</button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border mb-4">
              <div className="font-bold mb-2 text-orange-700">Review Shipment Details</div>
              <div className="mb-1"><b>Sender:</b> {user?.first_name + ' ' + user?.last_name} ({user?.email})</div>
              <div className="mb-1"><b>Recipient:</b> {form.recipient_name}, {form.recipient_email}, {form.recipient_phone}</div>
              <div className="mb-1"><b>Delivery Address:</b> {form.delivery_address_text}</div>
              <div className="mb-1"><b>Package:</b> {packages.find(p => p.id == form.package_id)?.description || ''}</div>
              <div className="mb-1"><b>Supplier:</b> {couriers.find(c => c.id == form.courier_id)?.first_name + ' ' + couriers.find(c => c.id == form.courier_id)?.last_name || ''}</div>
              <div className="mb-1"><b>Pickup Address:</b> {pickupAddresses.find(a => a.id == form.pickup_address_id)?.label || ''}</div>
              <div className="mb-1"><b>Pickup Date:</b> {form.pickup_date}</div>
              <div className="mb-1"><b>Shipment Type:</b> {form.shipment_type}</div>
              <div className="mb-1"><b>Special Instructions:</b> {form.special_instructions}</div>
              <div className="mb-1"><b>Insurance Required:</b> {form.insurance_required ? 'Yes' : 'No'}</div>
              <div className="mb-1"><b>Signature Required:</b> {form.signature_required ? 'Yes' : 'No'}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">Back</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600">Create Shipment</button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ShipmentForm;
