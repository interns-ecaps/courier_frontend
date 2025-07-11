import { useEffect, useState } from "react";
import { Plus, MapPin, Check, Home, Building, Navigation, Trash2, Edit3, Star, X, ChevronDown, Search } from "lucide-react";
import { getMyAddresses, createAddress, patchAddress, getCountries } from "../../../services/addressService";
import { toast } from "react-toastify";

const addressFields = [
  { field: "label", label: "Label", type: "text" },
  { field: "street_address", label: "Street Address", type: "text" },
  { field: "city", label: "City", type: "text" },
  { field: "state", label: "State", type: "text" },
  { field: "postal_code", label: "Postal Code", type: "text" },
  { field: "country_code", label: "Country", type: "dropdown" },
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
  const [editingAddress, setEditingAddress] = useState(null);
  const [editAddressData, setEditAddressData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditCountryDropdown, setShowEditCountryDropdown] = useState(false);
  const [editCountrySearchTerm, setEditCountrySearchTerm] = useState("");

  const fetchAddresses = async () => {
    try {
      const response = await getMyAddresses();
      const responseData = response.data || response;
      const addressData = responseData.results || [];
      if (Array.isArray(addressData)) {
        setAddresses(addressData);
      } else {
        setAddresses([]);
        toast.error("Invalid address data format");
      }
    } catch (error) {
      setAddresses([]);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      const response = await getCountries();
      const countriesData = response.results || [];
      setCountries(countriesData);
    } catch (error) {
      setCountries([]);
      toast.error("Failed to load countries");
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
      toast.error("Failed to set default address.");
    } finally {
      setSettingDefault(null);
    }
  };

  const getCountryName = (countryId) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : "Unknown Country";
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );
  const selectedCountry = countries.find(c => c.id == newAddress.country_code);

  const filteredEditCountries = countries.filter(country =>
    country.name.toLowerCase().includes(editCountrySearchTerm.toLowerCase())
  );
  const selectedEditCountry = countries.find(c => c.id == editAddressData?.country_code);

  const getAddressIcon = (label) => {
    const lowerLabel = label?.toLowerCase() || '';
    if (lowerLabel.includes('home') || lowerLabel.includes('house')) return <Home className="w-6 h-6" />;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return <Building className="w-6 h-6" />;
    if (lowerLabel.includes('delivery') || lowerLabel.includes('pickup')) return <Navigation className="w-6 h-6" />;
    return <MapPin className="w-6 h-6" />;
  };

  const getAddressColor = (label) => {
    const lowerLabel = label?.toLowerCase() || '';
    if (lowerLabel.includes('home')) return 'from-blue-500 to-blue-600';
    if (lowerLabel.includes('work')) return 'from-purple-500 to-purple-600';
    if (lowerLabel.includes('delivery')) return 'from-green-500 to-green-600';
    return 'from-orange-500 to-orange-600';
  };

  // At the top of the Address component, fetch the user name as first_name + ' ' + last_name
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const userName = (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : 'Your Name';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Loading your addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10"></div>
        <div className="relative z-10 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Addresses</h1>
                <p className="text-gray-600 text-lg">Manage your delivery and pickup locations</p>
              </div>
              <button
                onClick={() => setAddingAddress(true)}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Add New Address
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div>
        <div className="max-w-7xl mx-auto">
          {addresses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No addresses yet</h3>
              <p className="text-gray-600 mb-6">Add your first address to get started with shipments</p>
              <button
                onClick={() => setAddingAddress(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((address, index) => {
                const IconComponent = getAddressIcon(address.label);
                const colorClass = getAddressColor(address.label);
                
                return (
                  <div
                    key={address.id}
                    className={`group relative bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-white/50 overflow-hidden ${
                      address.is_default ? 'ring-2 ring-orange-300 bg-orange-50/50' : ''
                    }`}
                  >
                    {/* Gradient Header */}
                    <div className={`bg-gradient-to-r ${colorClass} p-6 text-white relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            {getAddressIcon(address.label)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{address.label || "Address"}</h3>
                            {address.is_default && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">Default Address</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {address.is_default ? (
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                              <Check className="w-4 h-4" />
                              Default
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              disabled={settingDefault === address.id}
                              className="flex items-center gap-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 disabled:opacity-50"
                            >
                              {settingDefault === address.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                        </div>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="p-6">
                      <div className="mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{userName}</h3>
                      </div>
                      <div className="text-gray-700 text-sm leading-relaxed mb-2">
                        {[address.street_address, address.landmark].filter(Boolean).join(', ')}<br/>
                        {[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}<br/>
                        {getCountryName(address.country_code)}
                      </div>
                      {/* Action Buttons and Default Badge remain as before */}
                    </div>

                    {/* Action Footer */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteAddress(index, address.id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-300 group"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-sm font-medium">Delete</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-300 group"
                            onClick={() => {
                              setEditingAddress(address);
                              setEditAddressData({ ...address });
                            }}
                          >
                            <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-sm font-medium">Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/5 group-hover:to-orange-600/5 transition-all duration-500 rounded-3xl pointer-events-none"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      {addingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all duration-500 scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Add New Address</h3>
                    <p className="text-orange-100 text-sm">Enter your address details</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddingAddress(false)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addressFields.map(({ field, label, type }) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">{label}
                      {(field === "label" || field === "street_address") && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {field === 'country_code' ? (
                      <div className="relative mt-2">
                        <button
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm flex items-center justify-between"
                        >
                          {selectedCountry ? selectedCountry.name : "Select Country"}
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2">
                              <input
                                type="text"
                                placeholder="Search countries..."
                                value={countrySearchTerm}
                                onChange={(e) => setCountrySearchTerm(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            {filteredCountries.map((country) => (
                              <div
                                key={country.id}
                                className="p-2 cursor-pointer hover:bg-orange-50"
                                onClick={() => {
                                  setNewAddress(prev => ({ ...prev, country_code: country.id }));
                                  setShowCountryDropdown(false);
                                  setCountrySearchTerm("");
                                }}
                              >
                                {country.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={type}
                        value={newAddress[field]}
                        onChange={(e) => handleNewAddressChange(field, e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-4 justify-end mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setAddingAddress(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAddress}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all duration-500 scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Edit Address</h3>
                    <p className="text-orange-100 text-sm">Update your address details</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAddress(null)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addressFields.map(({ field, label, type }) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">{label}
                      {(field === "label" || field === "street_address") && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {field === 'country_code' ? (
                      <div className="relative mt-2">
                        <button
                          onClick={() => setShowEditCountryDropdown(!showEditCountryDropdown)}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm flex items-center justify-between"
                        >
                          {selectedEditCountry ? selectedEditCountry.name : "Select Country"}
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showEditCountryDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2">
                              <input
                                type="text"
                                placeholder="Search countries..."
                                value={editCountrySearchTerm}
                                onChange={(e) => setEditCountrySearchTerm(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            {filteredEditCountries.map((country) => (
                              <div
                                key={country.id}
                                className="p-2 cursor-pointer hover:bg-orange-50"
                                onClick={() => {
                                  setEditAddressData(prev => ({ ...prev, country_code: country.id }));
                                  setShowEditCountryDropdown(false);
                                  setEditCountrySearchTerm("");
                                }}
                              >
                                {country.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={type}
                        value={editAddressData?.[field] || ""}
                        onChange={e => setEditAddressData(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Modal Footer */}
              <div className="flex gap-4 justify-end mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setEditingAddress(null)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editAddressData.label.trim() || !editAddressData.street_address.trim()) {
                      toast.error("Label and Street Address are required");
                      return;
                    }
                    setSavingEdit(true);
                    try {
                      await patchAddress(editingAddress.id, editAddressData);
                      toast.success("Address updated successfully!");
                      setEditingAddress(null);
                      setEditAddressData(null);
                      fetchAddresses();
                    } catch (error) {
                      toast.error("Failed to update address.");
                    } finally {
                      setSavingEdit(false);
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}