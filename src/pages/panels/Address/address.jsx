import { useEffect, useState } from "react";
import { Plus, MapPin, Check } from "lucide-react";
import InfoCard from "../InfoCard";
import { getMyAddresses, createAddress, patchAddress } from "../../../services/addressService";
import { toast } from "react-toastify";

const addressFields = [
  { field: "label", label: "Label", type: "text" },
  { field: "street_address", label: "Street Address", type: "text" },
  { field: "city", label: "City", type: "text" },
  { field: "state", label: "State", type: "text" },
  { field: "postal_code", label: "Postal Code", type: "text" },
  { field: "country_code", label: "Country Code", type: "text" },
  { field: "landmark", label: "Landmark", type: "text" },
];

export default function Address() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingAddress, setAddingAddress] = useState(false);
  const [settingDefault, setSettingDefault] = useState(null); // Track which address is being set as default
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
  useEffect(() => {
   
    fetchAddresses();
  }, []);

  const handleNewAddressChange = (field, value) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async () => {
    if (!newAddress.label.trim() || !newAddress.street_address.trim()) {
      toast.error("Label and Street Address are required");
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
    setSettingDefault(id); // Show loading state

    await patchAddress(id, { is_default: true }); // Backend ensures only this one is default

    fetchAddresses(); // Refresh updated list
    toast.success("Default address updated!");
  } catch (error) {
    console.error("Failed to set default address:", error);
    toast.error("Failed to set default address.");
  } finally {
    setSettingDefault(null);
  }
};


  return (
    <div className="relative w-full mx-auto px-4 py-6">
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setAddingAddress(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {loading ? (
        <p className="text-center text-orange-700">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p className="text-center text-orange-500">No addresses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((address, index) => (
            <div key={address.id} className={`relative ${address.is_default ? 'ring-2 ring-orange-300 bg-orange-50/30' : ''}`}>
              <InfoCard
                title={address.label || "Address"}
                fields={addressFields}
                section="addresses"
                index={index}
                addressData={{
                  id: address.id,
                  label: address.label,
                  street_address: address.street_address,
                  city: address.city,
                  state: address.state,
                  postal_code: address.postal_code,
                  country_code: address.country_code,
                  landmark: address.landmark,
                }}
                onDelete={() => handleDeleteAddress(index, address.id)}
              />
              
              {/* Stacked buttons in top-right corner */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {/* Default Address Button/Badge - Top position */}
                {address.is_default ? (
                  <div   className="flex items-center gap-1 bg-green-100 text-green-800 px-1.5 py-0.5 rounded shadow text-xs font-medium">
                    <Check className="w-2.5 h-2.5" />
                    Default
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefaultAddress(address.id)}
                    disabled={settingDefault === address.id}
                    className="flex items-center gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded shadow text-xs font-medium transition disabled:opacity-50 whitespace-nowrap"
                    aria-label="Set as default address"
                  >
                    {settingDefault === address.id ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        Setting...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-2.5 h-2.5" />
                        Set Default
                      </>
                    )}
                  </button>
                )}
                
                {/* Edit/Delete buttons will be rendered by InfoCard below the default button */}
              </div>
            </div>
          ))}
        </div>
      )}

      {addingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
          <div className="bg-orange-50 border border-orange-400 rounded-xl p-6 shadow-2xl w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4 text-orange-700">New Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addressFields.map(({ field, label, type }) => (
                <div key={field}>
                  <label className="text-sm font-semibold text-orange-700 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={newAddress[field]}
                    onChange={(e) => handleNewAddressChange(field, e.target.value)}
                    className="w-full border border-orange-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => setAddingAddress(false)}
                className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAddress}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}