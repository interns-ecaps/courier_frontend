// src/components/shipments/ShipmentForm.jsx
import React, { useEffect, useState } from 'react';
import {
  getMyAddresses,
  getAddressesByUserId,
} from '../../services/addressService';
import { getMyPackages, createPackage, getPackageTypes } from '../../services/packageService';
import { getAllCouriers } from '../../services/courierService';
import { toast } from 'react-toastify';
import { Fragment } from 'react';

const steps = [
  'Sender',
  'Recipient',
  'Package',
  'Supplier',
  'Shipment Details',
  'Review',
];

// Helper for floating label input
function FloatingInput({ label, ...props }) {
  return (
    <div className="relative mb-4">
      <input
        {...props}
        className={`peer w-full border border-gray-300 rounded-xl bg-gray-50 px-4 pt-6 pb-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition shadow-sm ${props.className || ''}`}
        placeholder=" "
      />
      <label className="absolute left-4 top-2 text-gray-500 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm bg-white/80 px-1">{label}</label>
    </div>
  );
}

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
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageForm, setPackageForm] = useState({
    package_type: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    is_negotiable: false,
    currency_id: '',
    estimated_cost: '',
    final_cost: '',
  });
  const [packageLoading, setPackageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [packageTypes, setPackageTypes] = useState([]);
  const [packageTypesLoading, setPackageTypesLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

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
    // Fetch package types from backend
    setPackageTypesLoading(true);
    getPackageTypes()
      .then(res => {
        let types = res.data.package_types;
        setPackageTypes(Array.isArray(types) ? types : []);
      })
      .catch(() => setPackageTypes([]))
      .finally(() => setPackageTypesLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handlePackageFormChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPackageForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setPackageLoading(true);
    try {
      const payload = {
        ...packageForm,
        weight: packageForm.weight ? parseFloat(packageForm.weight) : undefined,
        length: packageForm.length ? parseFloat(packageForm.length) : undefined,
        width: packageForm.width ? parseFloat(packageForm.width) : undefined,
        height: packageForm.height ? parseFloat(packageForm.height) : undefined,
        currency_id: packageForm.currency_id ? parseInt(packageForm.currency_id, 10) : undefined,
        estimated_cost: packageForm.estimated_cost ? parseFloat(packageForm.estimated_cost) : undefined,
        final_cost: packageForm.final_cost ? parseFloat(packageForm.final_cost) : undefined,
      };
      Object.keys(payload).forEach((key) => payload[key] === '' && delete payload[key]);
      await createPackage(payload);
      toast.success('Package created!');
      setShowPackageModal(false);
      setPackageForm({
        package_type: '', weight: '', length: '', width: '', height: '', is_negotiable: false, currency_id: '', estimated_cost: '', final_cost: '',
      });
      // Refresh packages
      const pkgRes = await getMyPackages();
      setPackages(pkgRes.data.results || []);
    } catch (err) {
      toast.error('Failed to create package');
    } finally {
      setPackageLoading(false);
    }
  };

  const validateRecipient = () => {
    const errors = {};
    if (!form.delivery_address_text || form.delivery_address_text.trim().length < 5) {
      errors.delivery_address_text = 'Delivery address is required (min 5 characters)';
    }
    if (!form.recipient_name || form.recipient_name.trim().length < 2) {
      errors.recipient_name = 'Recipient name is required (min 2 characters)';
    }
    if (!form.recipient_email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.recipient_email)) {
      errors.recipient_email = 'Valid email is required';
    }
    if (!form.recipient_phone || !/^\d{10,15}$/.test(form.recipient_phone)) {
      errors.recipient_phone = 'Valid phone number (10-15 digits) is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        return true; // Sender is always filled
      case 1:
        return validateRecipient();
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
    setSubmitting(true);
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

        // Convert IDs to integers or undefined
        const payload = {
          pickup_address_id: pickup_address_id ? parseInt(pickup_address_id, 10) : undefined,
          recipient_name: recipient_name || undefined,
          recipient_email: recipient_email || undefined,
          recipient_phone: recipient_phone || undefined,
          delivery_address_text: delivery_address_text?.trim() ? delivery_address_text : null,
          courier_id: courier_id ? parseInt(courier_id, 10) : undefined,
          shipment_type: shipment_type || undefined,
          package_id: package_id ? parseInt(package_id, 10) : undefined,
          pickup_date: pickup_date ? new Date(pickup_date).toISOString() : undefined,
          special_instructions: special_instructions?.trim() ? special_instructions : null,
          insurance_required: !!insurance_required,
          signature_required: !!signature_required,
        };

        // Remove undefined fields (shouldn't happen, but for safety)
        Object.keys(payload).forEach(
          (key) => payload[key] === undefined && delete payload[key]
        );

        await onSubmit(payload);
      } catch (err) {
        toast.error('Submission failed');
      }
    }
    setSubmitting(false);
  };

  const disabled = readOnly;

  // Stepper progress calculation
  const stepCount = steps.length - 1;
  const offset = (1 / stepCount) * 100 / 2;
  let progressPercent = (step / stepCount) * 100 + offset;
  if (progressPercent > 100) progressPercent = 100;

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Stepper with progress bar */}
        <div className="mb-8">
          <div className="relative flex items-center justify-center gap-2 mb-4">
            <div className="absolute left-0 right-0 top-1/2 h-2 bg-orange-100 rounded-full z-0" style={{ zIndex: 0 }} />
            <div className="absolute left-0 top-1/2 h-2 bg-orange-400 rounded-full z-10 transition-all duration-500" style={{ width: `${progressPercent}%`, zIndex: 1 }} />
            {steps.map((label, idx) => (
              <Fragment key={label}>
                <div className={`relative z-20 w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg shadow-lg transition-all duration-300 ${step === idx ? 'bg-orange-500 text-white scale-110' : 'bg-white text-orange-500 border-2 border-orange-300'}`}>{idx + 1}</div>
                {idx < steps.length - 1 && <div className="w-8 h-1" />}
              </Fragment>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-2">
            {steps.map((label, idx) => (
              <span key={label} className={step === idx ? 'text-orange-500 font-bold' : ''}>{label}</span>
            ))}
          </div>
        </div>
        {error && <p className="text-red-500 mb-2 text-center animate-pulse">{error}</p>}
        <div className="flex-1 flex flex-col justify-center transition-all duration-500">
          {/* Step 0: Sender */}
          {step === 0 && (
            <div className="space-y-4 animate-fadeInStep">
              <div className="bg-gray-50/80 p-4 rounded-xl border shadow-sm">
                <div className="mb-2 font-semibold">Sender Details</div>
                <div className="flex flex-col gap-2">
                  <FloatingInput value={user?.first_name + ' ' + user?.last_name} readOnly label="Name" />
                  <FloatingInput value={user?.email} readOnly label="Email" />
                </div>
              </div>
              <button type="button" onClick={handleNext} className="w-full bg-orange-500 text-white py-3 px-4 rounded-full hover:bg-orange-600 font-bold text-lg shadow transition-all duration-200">Next</button>
            </div>
          )}
          {/* Step 1: Recipient */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeInStep">
              <FloatingInput
                type="text"
                name="delivery_address_text"
                placeholder="Delivery Address"
                value={form.delivery_address_text}
                onChange={handleChange}
                disabled={disabled}
                required
                label="Delivery Address"
              />
              {fieldErrors.delivery_address_text && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.delivery_address_text}</p>
              )}
              <FloatingInput
                type="text"
                name="recipient_name"
                placeholder="Recipient Name"
                value={form.recipient_name}
                onChange={handleChange}
                disabled={disabled}
                required
                label="Recipient Name"
              />
              {fieldErrors.recipient_name && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.recipient_name}</p>
              )}
              <FloatingInput
                type="email"
                name="recipient_email"
                placeholder="Recipient Email"
                value={form.recipient_email}
                onChange={handleChange}
                disabled={disabled}
                required
                label="Recipient Email"
              />
              {fieldErrors.recipient_email && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.recipient_email}</p>
              )}
              <FloatingInput
                type="text"
                name="recipient_phone"
                placeholder="Recipient Phone"
                value={form.recipient_phone}
                onChange={handleChange}
                disabled={disabled}
                required
                label="Recipient Phone"
              />
              {fieldErrors.recipient_phone && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.recipient_phone}</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300">Back</button>
                <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600">Next</button>
              </div>
            </div>
          )}
          {/* Step 2: Package */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeInStep">
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Select Package</label>
                <button type="button" onClick={() => setShowPackageModal(true)} className="text-orange-500 hover:underline text-sm">+ Create New Package</button>
              </div>
              <select
                name="package_id"
                value={form.package_id}
                onChange={handleChange}
                disabled={disabled}
                required
                className="w-full border p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
              >
                <option value="">Select Package</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.description ? p.description + ' - ' : ''}${p.weight}kg`}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300">Back</button>
                <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600">Next</button>
              </div>
            </div>
          )}
          {/* Step 3: Supplier */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeInStep">
              <select
                name="courier_id"
                value={form.courier_id}
                onChange={handleChange}
                disabled={disabled}
                required
                className="w-full border p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
              >
                <option value="">Select Supplier</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.first_name} ${c.last_name}`}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300">Back</button>
                <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600">Next</button>
              </div>
            </div>
          )}
          {/* Step 4: Shipment Details */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeInStep">
              <select
                name="pickup_address_id"
                value={form.pickup_address_id}
                onChange={handleChange}
                disabled={disabled}
                required
                className="w-full border p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
              >
                <option value="">Select Pickup Address</option>
                {pickupAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label || `${a.address_line}, ${a.city}`}
                  </option>
                ))}
              </select>
              <FloatingInput
                type="datetime-local"
                name="pickup_date"
                value={form.pickup_date}
                onChange={handleChange}
                disabled={disabled}
                required
                label="Pickup Date"
              />
              {/* Allow supplier to edit estimated_delivery */}
              {user?.user_type === 'supplier' && (
                <FloatingInput
                  type="datetime-local"
                  name="estimated_delivery"
                  value={form.estimated_delivery || ''}
                  onChange={handleChange}
                  label="Estimated Delivery"
                  required
                />
              )}
              <select
                name="shipment_type"
                value={form.shipment_type}
                onChange={handleChange}
                disabled={disabled}
                className="w-full border p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="overnight">Overnight</option>
                <option value="same_day">Same Day</option>
              </select>
              <FloatingInput
                type="textarea"
                name="special_instructions"
                value={form.special_instructions}
                onChange={handleChange}
                disabled={disabled}
                placeholder="Special instructions"
                label="Special Instructions"
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
                <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300">Back</button>
                <button type="button" onClick={handleNext} className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600">Next</button>
              </div>
            </div>
          )}
          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeInStep">
              <div className="bg-gray-50/80 p-4 rounded-xl border shadow-sm">
                <div className="font-bold mb-2 text-orange-700 text-center">Review Shipment Details</div>
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
                <button type="button" onClick={handleBack} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300">Back</button>
                <button type="submit" className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-full hover:bg-orange-600">Create Shipment</button>
              </div>
            </div>
          )}
        </div>
      </form>
      {/* Package Modal rendered outside the main form */}
      {showPackageModal && (
        <div className="fixed inset-0 h-screen w-screen flex items-center justify-center z-50 bg-black/20">
          <div className="relative max-w-md w-full mx-auto rounded-2xl shadow-2xl border border-orange-100 bg-white p-8 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowPackageModal(false)} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-orange-500 bg-white rounded-full shadow p-1 transition-all duration-200">✕</button>
            <h3 className="text-2xl font-bold mb-6 text-orange-600 text-center">Create New Package</h3>
            <form onSubmit={handleCreatePackage} className="w-full space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Type</label>
                <select name="package_type" value={packageForm.package_type} onChange={handlePackageFormChange} required className="w-full border border-gray-300 rounded-lg bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" disabled={packageTypesLoading || packageTypes.length === 0}>
                  <option value="">{packageTypesLoading ? 'Loading types...' : 'Select Type'}</option>
                  {packageTypes.map((type) => (
                    <option key={typeof type === 'string' ? type : type.value} value={typeof type === 'string' ? type : type.value}>{typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1) : type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Weight</label>
                <input type="number" name="weight" value={packageForm.weight} onChange={handlePackageFormChange} required placeholder="Weight (kg)" min="0.01" step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Length</label>
                <input type="number" name="length" value={packageForm.length} onChange={handlePackageFormChange} required placeholder="Length (cm)" min="0.01" step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Width</label>
                <input type="number" name="width" value={packageForm.width} onChange={handlePackageFormChange} required placeholder="Width (cm)" min="0.01" step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Height</label>
                <input type="number" name="height" value={packageForm.height} onChange={handlePackageFormChange} required placeholder="Height (cm)" min="0.01" step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Currency ID</label>
                <input type="number" name="currency_id" value={packageForm.currency_id} onChange={handlePackageFormChange} required placeholder="Currency ID" min="1" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Estimated Cost</label>
                <input type="number" name="estimated_cost" value={packageForm.estimated_cost} onChange={handlePackageFormChange} placeholder="Estimated Cost (optional)" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Final Cost</label>
                <input type="number" name="final_cost" value={packageForm.final_cost} onChange={handlePackageFormChange} placeholder="Final Cost (optional)" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition" />
              </div>
              <label className="flex items-center gap-2 text-gray-700 font-medium">
                <input type="checkbox" name="is_negotiable" checked={packageForm.is_negotiable} onChange={handlePackageFormChange} className="accent-orange-500 w-5 h-5 rounded focus:ring-2 focus:ring-orange-400" />
                Negotiable
              </label>
              <button type="submit" disabled={packageLoading} className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 px-4 rounded-xl hover:from-orange-500 hover:to-orange-600 font-bold text-lg shadow transition-all duration-200 flex items-center justify-center mt-2">{packageLoading ? <span className="loader mr-2"></span> : null}{packageLoading ? 'Creating...' : 'Create Package'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ShipmentForm;
