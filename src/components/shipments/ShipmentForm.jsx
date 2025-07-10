// src/components/shipments/ShipmentForm.jsx
import React, { useEffect, useState } from 'react';
import {
  getMyAddresses,
  getAddressesByUserId,
} from '../../services/addressService';
import { createPackage, getMyPackages, updatePackage } from '../../services/packageService';
import api from '../../utils/axiosInstance';
import { getAllCouriers } from '../../services/courierService';
import { toast } from 'react-toastify';

const steps = [
  'Sender',
  'Recipient',
  'Package Details',
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
    // Individual address fields
    recipient_name: '',
    recipient_street: '',
    recipient_city: '',
    recipient_state: '',
    recipient_country: '',
    recipient_postal_code: '',
    // Combined address field (will be generated)
    delivery_address_text: '',
    recipient_email: '',
    recipient_phone: '',
    courier_id: '',
    shipment_type: 'standard',
    pickup_date: '',
    special_instructions: '',
    insurance_required: false,
    signature_required: false,
    // Package details
    package_type: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    is_negotiable: false,
    currency_id: '',
    final_cost: '',
    ...initialValues,
  });
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState({});
  const [packageTypes, setPackageTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Set default pickup_date to now if in create mode and not already set
  useEffect(() => {
    if (mode === 'create' && !form.pickup_date) {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setForm((prev) => ({ ...prev, pickup_date: formatted }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [addrRes, pkgRes, courierRes, pkgTypeRes, currencyRes] = await Promise.all([
          getMyAddresses(),
          getMyPackages(),
          getAllCouriers(),
          api.get('/shipment/v1/package_types/'),
          api.get('/shipment/v1/currencies/')
        ]);
        console.log('Package types API response:', pkgTypeRes.data);
        setPickupAddresses(addrRes.data.results || []);
        setPackages(pkgRes.data.results || []);
        setCouriers(courierRes.data.results || []);
        setPackageTypes(pkgTypeRes.data.package_types || pkgTypeRes.data || []);
        setCurrencies(currencyRes.data.results || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load initial form data.');
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    // Only run for update mode and if delivery_address_text is present
    if (mode === 'update' && initialValues.delivery_address_text) {
      // Only fill if the fields are not already set
      const fields = [
        'recipient_name',
        'recipient_street',
        'recipient_city',
        'recipient_state',
        'recipient_country',
        'recipient_postal_code',
      ];
      const anyMissing = fields.some(f => !initialValues[f]);
      if (anyMissing) {
        const parts = initialValues.delivery_address_text.split(',').map(s => s.trim());
        setForm(prev => ({
          ...prev,
          recipient_name: prev.recipient_name || parts[0] || '',
          recipient_street: prev.recipient_street || parts[1] || '',
          recipient_city: prev.recipient_city || parts[2] || '',
          recipient_state: prev.recipient_state || parts[3] || '',
          recipient_country: prev.recipient_country || parts[4] || '',
          recipient_postal_code: prev.recipient_postal_code || parts[5] || '',
        }));
      }
    }
    // Always handle pickup_date for update mode
    if (mode === 'update' && initialValues.pickup_date) {
      const d = new Date(initialValues.pickup_date);
      if (!isNaN(d.getTime())) {
        const pad = (n) => n.toString().padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setForm(prev => ({ ...prev, pickup_date: formatted }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialValues.delivery_address_text, initialValues.pickup_date]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        return true; // Sender is always filled
      case 1:
        return (
          form.recipient_name &&
          form.recipient_street &&
          form.recipient_city &&
          form.recipient_state &&
          form.recipient_country &&
          form.recipient_postal_code &&
          form.recipient_email &&
          validateEmail(form.recipient_email) &&
          form.recipient_phone
        );
      case 2:
        return (
          form.package_type &&
          form.weight &&
          form.length &&
          form.width &&
          form.height &&
          form.currency_id &&
          form.final_cost
        );
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
      // Check for specific validation errors
      if (step === 1 && form.recipient_email && !validateEmail(form.recipient_email)) {
        setError('Please enter a valid email address.');
      } else {
        setError('Please fill all required fields for this step.');
      }
    }
  };

  const handleBack = (e) => {
    e && e.preventDefault();
    setStep((s) => Math.max(s - 1, 0));
    setError('');
  };

  // Helper to get current datetime-local string (YYYY-MM-DDTHH:MM)
  const getNowDatetimeLocal = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate pickup_date is not in the past
    const now = new Date();
    const pickupDate = new Date(form.pickup_date);
    if (pickupDate < now) {
      setError('Pickup date/time cannot be in the past.');
      return;
    }
    if (onSubmit) {
      try {
        // Extract package details from form
        const packageData = {
          package_type: form.package_type,
          weight: parseFloat(form.weight),
          length: parseFloat(form.length),
          width: parseFloat(form.width),
          height: parseFloat(form.height),
          is_negotiable: form.is_negotiable,
          currency_id: parseInt(form.currency_id),
          final_cost: parseFloat(form.final_cost)
        };

        let packageId = form.package_id;
        if (mode === 'update' && initialValues.package_id) {
          // Compare fields to see if any package fields have changed
          const fields = [
            'package_type', 'weight', 'length', 'width', 'height', 'is_negotiable', 'currency_id', 'final_cost'
          ];
          let changed = false;
          for (const field of fields) {
            if (packageData[field] !== initialValues[field]) {
              changed = true;
              break;
            }
          }
          if (changed) {
            // Update the package
            await updatePackage(initialValues.package_id, packageData);
          }
          packageId = initialValues.package_id;
        } else {
          // Create package first
          const packageResponse = await createPackage(packageData);
          packageId = packageResponse.data.id;
        }

        // Concatenate address fields into delivery_address_text
        const delivery_address_text = `${form.recipient_name}, ${form.recipient_street}, ${form.recipient_city}, ${form.recipient_state}, ${form.recipient_country}, ${form.recipient_postal_code}`;

        // Prepare shipment data with all required fields
        const finalShipmentData = {
          // Recipient details
          recipient_name: form.recipient_name,
          recipient_email: form.recipient_email,
          recipient_phone: form.recipient_phone,
          delivery_address_text: delivery_address_text,
          
          // Shipment details - ensure required fields are not undefined
          courier_id: parseInt(form.courier_id, 10),
          pickup_address_id: parseInt(form.pickup_address_id, 10),
          shipment_type: form.shipment_type,
          pickup_date: new Date(form.pickup_date).toISOString(),
          special_instructions: form.special_instructions || "",
          insurance_required: !!form.insurance_required,
          signature_required: !!form.signature_required,
          
          // Package ID from created/updated package
          package_id: packageId,
        };

        console.log("Final shipment data being sent:", finalShipmentData);
        console.log("Package data:", packageData);
        console.log("Package ID:", packageId);

        await onSubmit(finalShipmentData);
      } catch (err) {
        toast.error('Failed to create shipment');
      }
    }
  };

  const disabled = readOnly;

  // Helper to format address for dropdown
  const formatAddress = (address) => {
    if (!address) return '';
    const parts = [
      address.label,
      address.street_address,
      address.city,
      address.state,
      address.country_name || address.country, // support both keys
      address.postal_code,
    ];
    return parts.filter(Boolean).join(', ');
  };

  // --- Sticky Navigation Bar ---
  // Only show if not readOnly
  const showStickyNav = !readOnly;

  // Determine which buttons to show
  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;

  return (
    <>
      {/* 1. Wrap the form in a gradient background */}
      {/* Outer container: fill all available space after sidebar and navbar */}
      <div className="min-h-screen w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 px-0 py-0">
        <form onSubmit={handleSubmit} className="w-full h-full max-w-3xl bg-white shadow-2xl rounded-3xl p-8 space-y-8 transition-all duration-300">
          {/* Stepper with divider */}
          <div>
            <div className="flex items-center justify-between mb-4">
              {steps.map((s, idx) => (
                <div key={s} className="flex-1 flex flex-col items-center transition-all duration-300">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg border-2 ${
                    idx < step
                      ? 'bg-orange-500 text-white border-orange-500'
                      : idx === step
                      ? 'bg-white text-orange-500 border-orange-500 shadow-lg'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}>
                    {idx < step ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`mt-3 text-xs font-light tracking-wide ${idx === step ? 'text-orange-500' : 'text-gray-400'}`}>{s}</span>
                </div>
              ))}
            </div>
            <div className="border-b border-gray-200 mb-6"></div>
          </div>
          {/* Error message */}
          {error && <div className="text-red-500 text-center font-semibold mb-4">{error}</div>}
          {/* All form fields in a single column, each with label and input */}
          <div className="space-y-6">
            {step === 0 && (
              <>
                <label className="block font-bold mb-2">Sender Name</label>
                <input value={user?.first_name + ' ' + user?.last_name} readOnly className="w-full bg-gray-50 text-gray-700 border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400 mb-4 transition-all" />
                <label className="block font-bold mb-2">Sender Email</label>
                <input value={user?.email} readOnly className="w-full bg-gray-50 text-gray-700 border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400 transition-all" />
              </>
            )}
            {step === 1 && (
              <>
                <label className="block font-bold mb-2">Full Name</label>
                <input type="text" name="recipient_name" placeholder="Full Name" value={form.recipient_name || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Email</label>
                <input type="email" name="recipient_email" placeholder="Email" value={form.recipient_email || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Phone</label>
                <input type="text" name="recipient_phone" placeholder="Phone" value={form.recipient_phone || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Street Address</label>
                <input type="text" name="recipient_street" placeholder="Street Address" value={form.recipient_street || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">City</label>
                <input type="text" name="recipient_city" placeholder="City" value={form.recipient_city || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">State</label>
                <input type="text" name="recipient_state" placeholder="State" value={form.recipient_state || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Country</label>
                <input type="text" name="recipient_country" placeholder="Country" value={form.recipient_country || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Postal Code</label>
                <input type="text" name="recipient_postal_code" placeholder="Postal Code" value={form.recipient_postal_code || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
              </>
            )}
            {step === 2 && (
              <>
                <label className="block font-bold mb-2">Package Type</label>
                <select name="package_type" value={form.package_type || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-700 bg-white transition-all">
                  <option value="">Select Package Type</option>
                  {packageTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <label className="block font-bold mb-2">Weight (kg)</label>
                <input type="number" name="weight" placeholder="Weight (kg)" value={form.weight || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Length (cm)</label>
                <input type="number" name="length" placeholder="Length (cm)" value={form.length || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Width (cm)</label>
                <input type="number" name="width" placeholder="Width (cm)" value={form.width || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Height (cm)</label>
                <input type="number" name="height" placeholder="Height (cm)" value={form.height || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <label className="block font-bold mb-2">Currency</label>
                <select name="currency_id" value={form.currency_id || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-700 bg-white transition-all">
                  <option value="">Select Currency</option>
                  {currencies.map((currency, idx) => (
                    <option key={currency.id || idx} value={currency.id}>{currency.currency}</option>
                  ))}
                </select>
                <label className="block font-bold mb-2">Price</label>
                <input type="number" name="final_cost" placeholder="Price" value={form.final_cost || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400" />
                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center text-gray-500 text-sm">
                    <input type="checkbox" name="is_negotiable" checked={form.is_negotiable} onChange={handleChange} disabled={disabled} className="mr-2 accent-orange-500" /> Negotiable
                  </label>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <label className="block font-bold mb-2">Supplier</label>
                <select name="courier_id" value={form.courier_id || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-700 bg-white transition-all">
                  <option value="">Select Supplier</option>
                  {couriers.map((courier, idx) => (
                    <option key={courier.id || idx} value={courier.id}>{courier.first_name} {courier.last_name}</option>
                  ))}
                </select>
              </>
            )}
            {step === 4 && (
              <>
                <label className="block font-bold mb-2">Pickup Address</label>
                <select name="pickup_address_id" value={form.pickup_address_id || ""} onChange={handleChange} disabled={disabled} required className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-700 bg-white mb-4 transition-all">
                  <option value="">Select Pickup Address</option>
                  {pickupAddresses.map((address, idx) => (
                    <option key={address.id || idx} value={address.id}>{formatAddress(address)}</option>
                  ))}
                </select>
                <label className="block font-bold mb-2">Pickup Date/Time</label>
                <input type="datetime-local" name="pickup_date" value={form.pickup_date || ""} onChange={handleChange} disabled={disabled} required min={getNowDatetimeLocal()} className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400 mb-4 transition-all" />
                <label className="block font-bold mb-2">Special Instructions (Optional)</label>
                <textarea name="special_instructions" placeholder="Special Instructions (Optional)" value={form.special_instructions || ""} onChange={handleChange} disabled={disabled} className="w-full border-0 border-b border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-gray-400 mb-4 transition-all" rows="3" />
                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center text-gray-500 text-sm">
                    <input type="checkbox" name="insurance_required" checked={form.insurance_required} onChange={handleChange} disabled={disabled} className="mr-2 accent-orange-500" /> Insurance Required
                  </label>
                  <label className="flex items-center text-gray-500 text-sm">
                    <input type="checkbox" name="signature_required" checked={form.signature_required} onChange={handleChange} disabled={disabled} className="mr-2 accent-orange-500" /> Signature Required
                  </label>
                </div>
              </>
            )}
            {step === 5 && (
              <div>
                <div className="text-2xl font-extrabold mb-6">Review Shipment Details</div>
                <div className="space-y-2 text-base text-gray-700">
                  <div className="flex flex-wrap gap-4">
                    <div><span className="font-semibold">Recipient:</span> {form.recipient_name}</div>
                    <div><span className="font-semibold">Email:</span> {form.recipient_email}</div>
                    <div><span className="font-semibold">Phone:</span> {form.recipient_phone}</div>
                    <div><span className="font-semibold">Delivery Address:</span> {form.recipient_name}, {form.recipient_street}, {form.recipient_city}, {form.recipient_state}, {form.recipient_country}, {form.recipient_postal_code}</div>
                    <div><span className="font-semibold">Package Type:</span> {form.package_type}</div>
                    <div><span className="font-semibold">Weight:</span> {form.weight}kg</div>
                    <div><span className="font-semibold">Dimensions:</span> {form.length}x{form.width}x{form.height}cm</div>
                    <div><span className="font-semibold">Price:</span> ${form.final_cost}</div>
                    <div><span className="font-semibold">Pickup Date:</span> {form.pickup_date}</div>
                    {form.special_instructions && <div><span className="font-semibold">Special Instructions:</span> {form.special_instructions}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Sticky Navigation Bar */}
          {showStickyNav && (
            <div className="sticky bottom-0 left-0 w-full bg-white border-t border-gray-100 px-0 py-4 z-10 flex gap-2 justify-between">
              {!isFirstStep && (
                <button type="button" onClick={handleBack} className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all">Back</button>
              )}
              {!isLastStep && (
                <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all">Next: {steps[step + 1]}</button>
              )}
              {isLastStep && (
                <button type="submit" className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all">{mode === 'update' ? 'Update Shipment' : 'Create Shipment'}</button>
              )}
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default ShipmentForm;
