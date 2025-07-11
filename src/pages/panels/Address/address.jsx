import { useEffect, useState } from "react";
import { Plus, MapPin, Check, Home, Building, Navigation, Trash2, Edit3, Star, X, ChevronDown, Search } from "lucide-react";
import InfoCard from "../InfoCard";
import { getMyAddresses, createAddress, patchAddress, getCountries } from "../../../services/addressService";
import { toast } from "react-toastify";

const addressFields = [
  { field: "label", label: "Label", type: "text" },
  { field: "street_address", label: "Street Address", type: "text" },
  { field: "city", label: "City", type: "text" },
  { field: "state", label: "State", type: "text" },
  { field: "postal_code", label: "Postal Code", type: "text" },
  { field: "landmark", label: "Landmark", type: "text" },
];

export default function Address() {
  const [addresses, setAddresses] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [addingAddress, setAddingAddress] = useState(false);
  const [settingDefault, setSettingDefault] = useState(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [newAddress, setNewAddress] = useState({
    label: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "",
    landmark: "",
  });

  const fetchAddresses = async () => {
    try {
      const response = await getMyAddresses();
      const responseData = response.data || response;
      const addressData = responseData.results || [];
      
      if (Array.isArray(addressData)) {
        setAddresses(addressData);
      } else {
        console.error("API response results is not an array:", addressData);
        setAddresses([]);
        toast.error("Invalid address data format");
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      toast.error("Failed to load addresses");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      console.log('Starting to fetch countries...');
      console.log('Access token:', sessionStorage.getItem('accessToken'));
      
      const response = await getCountries();
      console.log('Countries response:', response);
      const countriesData = response.results || [];
      console.log('Countries data:', countriesData);
      setCountries(countriesData);
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // Show more specific error message
      if (error.response?.status === 401) {
        toast.error("Please log in to access countries");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to access countries");
      } else if (error.response?.status === 404) {
        toast.error("Countries endpoint not found");
      } else if (error.response?.status >= 500) {
        toast.error("Server error while loading countries");
      } else {
        toast.error("Failed to load countries. Please try again.");
      }
      
      setCountries([]);
    } finally {
      setCountriesLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchCountries();
  }, []);

  const handleNewAddressChange = (field, value) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async () => {
    if (!newAddress.label.trim() || !newAddress.street_address.trim() || !newAddress.country_code) {
      toast.error("Label, Street Address, and Country are required");
      return;
    }

    const payload = {
      label: newAddress.label,
      street_address: newAddress.street_address,
      city: newAddress.city,
      state: newAddress.state,
      postal_code: newAddress.postal_code,
      country_code: newAddress.country_code,
      landmark: newAddress.landmark,
      latitude: 0,
      longitude: 0,
    };

    try {
      const saved = await createAddress(payload);
      toast.success("Address saved successfully!");
      setAddresses((prev) => [...prev, saved]);
      setNewAddress({
        label: "",
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
        country_code: "",
        landmark: "",
      });
      setAddingAddress(false);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address.");
    }
  };

  const handleDeleteAddress = async (index, id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      await patchAddress(id, { is_deleted: true });
      toast.success("Address deleted successfully.");
      setAddresses((prev) => prev.filter((address) => address.id !== id));
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error("Failed to delete address.");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      setSettingDefault(id);
      await patchAddress(id, { is_default: true });
      fetchAddresses();
      toast.success("Default address updated!");
    } catch (error) {
      console.error("Failed to set default address:", error);
      toast.error("Failed to set default address.");
    } finally {
      setSettingDefault(null);
    }
  };

  const getAddressIcon = (label) => {
    const lowerLabel = label?.toLowerCase() || "";
    if (lowerLabel.includes('home') || lowerLabel.includes('house')) return <Home className="w-5 h-5" />;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return <Building className="w-5 h-5" />;
    return <MapPin className="w-5 h-5" />;
  };

  const getCountryName = (countryId) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : "Unknown Country";
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.id == newAddress.country_code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Addresses</h1>
              <p className="text-gray-600">Manage your delivery addresses</p>
            </div>
            <button
              type="button"
              onClick={() => setAddingAddress(true)}
              className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Address
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-orange-600">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium">Loading your addresses...</span>
            </div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses yet</h3>
              <p className="text-gray-600 mb-6">Add your first address to get started with deliveries</p>
              <button
                onClick={() => setAddingAddress(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Add Your First Address
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address, index) => (
              <div 
                key={address.id} 
                className={`relative group transition-all duration-300 ${
                  address.is_default 
                    ? 'ring-2 ring-orange-300 bg-gradient-to-br from-orange-50 to-white shadow-xl' 
                    : 'bg-white shadow-lg hover:shadow-xl'
                } rounded-2xl overflow-hidden`}
              >
                {/* Default Badge */}
                {address.is_default && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full shadow-lg">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">Default</span>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        address.is_default ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getAddressIcon(address.label)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {address.label || "Address"}
                        </h3>
                        {address.is_default && (
                          <p className="text-sm text-green-600 font-medium">Primary Address</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{address.street_address}</p>
                        <p className="text-gray-600 text-sm">
                          {[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {getCountryName(address.country_code)}
                        </p>
                        {address.landmark && (
                          <p className="text-gray-500 text-sm mt-1">
                            Near: {address.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    {!address.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(address.id)}
                        disabled={settingDefault === address.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {settingDefault === address.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            Setting...
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4" />
                            Set Default
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteAddress(index, address.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Add Address Modal */}
        {addingAddress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setAddingAddress(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Plus className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Add New Address</h3>
                      <p className="text-sm text-gray-600">Enter your address details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAddingAddress(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addressFields.map(({ field, label, type }) => (
                    <div key={field} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}
                        {(field === 'label' || field === 'street_address') && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        type={type}
                        value={newAddress[field]}
                        onChange={(e) => handleNewAddressChange(field, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                  
                  {/* Custom Country Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-left flex items-center justify-between"
                        disabled={countriesLoading}
                      >
                        <span className={selectedCountry ? "text-gray-900" : "text-gray-500"}>
                          {selectedCountry ? selectedCountry.name : "Select a country"}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-3 border-b border-gray-200">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search countries..."
                                value={countrySearchTerm}
                                onChange={(e) => setCountrySearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* Countries List */}
                          <div className="max-h-48 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <button
                                  key={country.id}
                                  type="button"
                                  onClick={() => {
                                    handleNewAddressChange('country_code', country.id);
                                    setShowCountryDropdown(false);
                                    setCountrySearchTerm("");
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-orange-50 focus:bg-orange-50 focus:outline-none transition-colors"
                                >
                                  {country.name}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                {countrySearchTerm ? "No countries found" : "Loading countries..."}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {countriesLoading && (
                      <p className="text-sm text-gray-500">Loading countries...</p>
                    )}
                    {!countriesLoading && countries.length === 0 && (
                      <p className="text-sm text-orange-600">
                        Unable to load countries. Please try refreshing the page or contact support.
                      </p>
                    )}
                    {!countriesLoading && countries.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {countries.length} countries available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAddingAddress(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}