import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
  const [newAddress, setNewAddress] = useState({
    label: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "",
    landmark: "",
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await getMyAddresses();
        // Extract the data from the response - the API returns a paginated response
        const responseData = response.data || response;
        
        // The API response has structure: { page, limit, total, results: [...] }
        // We need the results array
        const addressData = responseData.results || [];
        
        // Ensure it's an array
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
        setAddresses([]); // Ensure addresses is always an array
      } finally {
        setLoading(false);
      }
    };
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
      // Fixed typo: was 'ssetNewAddress'
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
      await patchAddress(id, { is_deleted: true }); // ✅ mark as deleted
      toast.success("Address deleted successfully.");
      setAddresses((prev) => prev.filter((address) => address.id !== id)); // locally remove
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error("Failed to delete address.");
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
        <div className="flex justify-around md:flex-nowrap flex-wrap gap-4">
          {addresses.map((address, index) => (
            <InfoCard
              key={address.id}
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