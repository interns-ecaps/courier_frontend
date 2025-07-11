// src/components/shipments/ShipmentForm.jsx
import React, { useEffect, useState, forwardRef } from 'react';
import {
  getMyAddresses,
  getAddressesByUserId,
} from '../../services/addressService';
import { createPackage, getMyPackages, updatePackage } from '../../services/packageService';
import api from '../../utils/axiosInstance';
import { getAllCouriers } from '../../services/courierService';
import { toast } from 'react-toastify';
import { User, Package, Truck, MapPin, Calendar, FileText, DollarSign, Shield, CheckCircle } from 'lucide-react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const steps = [
  'Sender',
  'Recipient',
  'Package Details',
  'Supplier',
  'Shipment Details',
  'Review',
];

const DatePickerInput = forwardRef(({ value, onClick, onChange, placeholder }, ref) => (
  <div className="relative w-full">
    <input
      type="text"
      readOnly
      ref={ref}
      value={value || ""}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-[48px] px-4 pr-12 py-3 border border-orange-200 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm placeholder-gray-400 hover:shadow-md text-base cursor-pointer"
    />
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center h-full pointer-events-none">
      <Calendar className="w-5 h-5 text-orange-400" />
    </div>
  </div>
));

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

  const getNowDatetimeLocal = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all required fields
    const requiredFields = [
      'recipient_name',
      'recipient_street',
      'recipient_city',
      'recipient_state',
      'recipient_country',
      'recipient_postal_code',
      'recipient_email',
      'recipient_phone',
      'package_type',
      'weight',
      'length',
      'width',
      'height',
      'currency_id',
      'final_cost',
      'courier_id',
      'pickup_address_id',
      'pickup_date',
    ];

    const missingFields = requiredFields.filter(field => !form[field]);
    if (missingFields.length > 0) {
      setError(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate email
    if (!validateEmail(form.recipient_email)) {
      setError('Please enter a valid email address.');
      return;
    }

      try {
      // Create delivery address text
      const deliveryAddressText = [
        form.recipient_name,
        form.recipient_street,
        form.recipient_city,
        form.recipient_state,
        form.recipient_country,
        form.recipient_postal_code,
      ].filter(Boolean).join(', ');

      // Create package first
        const packageData = {
        type: form.package_type,
          weight: parseFloat(form.weight),
          length: parseFloat(form.length),
          width: parseFloat(form.width),
          height: parseFloat(form.height),
          is_negotiable: form.is_negotiable,
        currency_id: form.currency_id,
        estimated_cost: parseFloat(form.final_cost),
        final_cost: parseFloat(form.final_cost),
        };

      let packageResponse;
        if (mode === 'update' && initialValues.package_id) {
        packageResponse = await updatePackage(initialValues.package_id, packageData);
        } else {
        packageResponse = await createPackage(packageData);
        }

      // Create shipment data
      const shipmentData = {
          recipient_name: form.recipient_name,
        recipient_street: form.recipient_street,
        recipient_city: form.recipient_city,
        recipient_state: form.recipient_state,
        recipient_country: form.recipient_country,
        recipient_postal_code: form.recipient_postal_code,
        delivery_address_text: deliveryAddressText,
          recipient_email: form.recipient_email,
          recipient_phone: form.recipient_phone,
        courier_id: form.courier_id,
        pickup_address_id: form.pickup_address_id,
          pickup_date: new Date(form.pickup_date).toISOString(),
        special_instructions: form.special_instructions,
        insurance_required: form.insurance_required,
        signature_required: form.signature_required,
        package_id: packageResponse.data.id,
        };

      const finalShipmentData = {
        ...shipmentData,
        ...(mode === 'update' && { id: initialValues.id }),
      };

        await onSubmit(finalShipmentData);
      } catch (err) {
        toast.error('Failed to create shipment');
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {mode === 'update' ? 'Update Shipment' : 'Create New Shipment'}
                  </h1>
                  <p className="text-orange-100 text-sm">
                    {mode === 'update' ? 'Modify your shipment details' : 'Fill in the details to create your shipment'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-red-500" />
              </div>
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sender Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-orange-100 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Sender Information</h2>
                <p className="text-sm text-gray-600">Your contact details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={`${user?.first_name || ''} ${user?.last_name || ''}`}
                  readOnly
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Recipient Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-orange-100 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Recipient Information</h2>
                <p className="text-sm text-gray-600">Who will receive the package</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="recipient_name"
                value={form.recipient_name || ""}
                onChange={handleChange}
                  required 
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input 
                  type="email" 
                  name="recipient_email" 
                  value={form.recipient_email || ""} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input 
                  type="tel" 
                  name="recipient_phone" 
                  value={form.recipient_phone || ""} 
                  onChange={handleChange} 
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address *</label>
              <input
                type="text"
                name="recipient_street"
                value={form.recipient_street || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                name="recipient_city"
                value={form.recipient_city || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province *</label>
              <input
                type="text"
                name="recipient_state"
                value={form.recipient_state || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
              <input
                type="text"
                name="recipient_country"
                value={form.recipient_country || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code *</label>
              <input
                type="text"
                name="recipient_postal_code"
                value={form.recipient_postal_code || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Package Details Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-orange-100 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Package Details</h2>
                <p className="text-sm text-gray-600">Physical package information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Package Type *</label>
              <select
                name="package_type"
                value={form.package_type || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select Package Type</option>
                {packageTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                ))}
              </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg) *</label>
              <input
                type="number"
                name="weight"
                value={form.weight || ""}
                onChange={handleChange}
                required
                  step="0.01"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Length (cm) *</label>
              <input
                type="number"
                name="length"
                value={form.length || ""}
                onChange={handleChange}
                required
                  step="0.1"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Width (cm) *</label>
              <input
                type="number"
                name="width"
                value={form.width || ""}
                onChange={handleChange}
                required
                  step="0.1"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm) *</label>
              <input
                type="number"
                name="height"
                value={form.height || ""}
                onChange={handleChange}
                required
                  step="0.1"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Currency *</label>
              <select
                name="currency_id"
                value={form.currency_id || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select Currency</option>
                  {currencies.map((currency, idx) => (
                    <option key={currency.id || idx} value={currency.id}>
                      {currency.currency}
                    </option>
                ))}
              </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
              <input
                type="number"
                name="final_cost"
                value={form.final_cost || ""}
                onChange={handleChange}
                required
                  step="0.01"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 text-gray-700 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <input 
                    type="checkbox" 
                    name="is_negotiable" 
                    checked={form.is_negotiable} 
                    onChange={handleChange} 
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
              />
                  <span className="text-sm font-semibold">Price is negotiable</span>
                </label>
              </div>
            </div>
          </div>

          {/* Supplier Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-orange-100 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Select Supplier</h2>
                <p className="text-sm text-gray-600">Choose who will handle your shipment</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
              <select
                name="courier_id"
                value={form.courier_id || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select Supplier</option>
                {couriers.map((courier, idx) => (
                  <option key={courier.id || idx} value={courier.id}>
                    {courier.first_name} {courier.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shipment Details Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-orange-100 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Shipment Details</h2>
                <p className="text-sm text-gray-600">Additional shipment information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Address *</label>
              <select
                name="pickup_address_id"
                value={form.pickup_address_id || ""}
                onChange={handleChange}
                required
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select Pickup Address</option>
                  {pickupAddresses.map((address, idx) => (
                    <option key={address.id || idx} value={address.id}>
                    {formatAddress(address)}
                  </option>
                ))}
              </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Date & Time *</label>
                <ReactDatePicker
                  selected={form.pickup_date ? new Date(form.pickup_date) : null}
                  onChange={date => handleChange({ target: { name: "pickup_date", value: date } })}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={new Date()}
                  placeholderText="Select pickup date & time"
                  name="pickup_date"
                  id="pickup_date"
                  autoComplete="off"
                  customInput={<DatePickerInput />}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Instructions (Optional)</label>
              <textarea
                name="special_instructions"
                value={form.special_instructions || ""}
                onChange={handleChange}
                rows="3"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 resize-none transition-all duration-200 shadow-sm hover:shadow-md" 
                  placeholder=""
              />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-3 text-gray-700 p-3 bg-orange-50 rounded-xl border border-orange-100 flex-1">
                <input
                  type="checkbox"
                  name="insurance_required"
                  checked={form.insurance_required}
                  onChange={handleChange}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                />
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold">Insurance Required</span>
              </label>
                <label className="flex items-center gap-3 text-gray-700 p-3 bg-orange-50 rounded-xl border border-orange-100 flex-1">
                <input
                  type="checkbox"
                  name="signature_required"
                  checked={form.signature_required}
                  onChange={handleChange}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                />
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold">Signature Required</span>
              </label>
              </div>
            </div>
        </div>

          {/* Submit Button */}
          <div className="flex justify-end">
              <button
                type="submit"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg flex items-center gap-3"
              >
              <DollarSign className="w-5 h-5" />
                {mode === 'update' ? 'Update Shipment' : 'Create Shipment'}
              </button>
          </div>
      </form>
      </div>
    </div>
  );
};

export default ShipmentForm;