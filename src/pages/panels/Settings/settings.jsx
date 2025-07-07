import { Edit2, Check, Plus, User, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast"; 

export default function Settings() {
  // Profile data with personal and multiple addresses details
  const [profileData, setProfileData] = useState({
    personal: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
    addresses: [],
  });

  // State to track which menu is active: "personal" or "address"
  const [activeMenu, setActiveMenu] = useState("personal");

  // Track edit states per field: { key: { submitting: boolean, saved: boolean } }
  const [editStates, setEditStates] = useState({});

  // Inline editing state: section ('personal' or 'addresses'), field, and index (for addresses)
  const [inlineEditField, setInlineEditField] = useState({ section: null, field: null, index: null });
  const [inlineEditValue, setInlineEditValue] = useState("");

  // Add Address form editing state
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: "",
    landmark: "",
  });

  // Password change inputs state
  const [passwordInputs, setPasswordInputs] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Loading and error state for profile fetch
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Helper key for editStates, separate by index for addresses
  function keyFor(section, field, index = null) {
    return index !== null ? `${section}_${index}_${field}` : `${section}_${field}`;
  }

  // Fetch profile data from backend on mount
  useEffect(() => {
    async function fetchProfile() {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const token = sessionStorage.getItem("accessToken");
        const response = await axios.get("http://localhost:8000/user/v1/users/", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (
          !response.data ||
          !response.data.results ||
          !Array.isArray(response.data.results) ||
          response.data.results.length === 0
        ) {
          throw new Error("No user data found");
        }

        // Extract user object from results array 
        const user = response.data.results[0];

        // Reshape to expected front-end shape:
        setProfileData({
          personal: {
            userId: user.id, // ✅ <-- Add this line
            email: user.email || "",
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            phoneNumber: user.phone_number || "",
            userType: user.user_type || "",
            // add more if needed and if available
          },
          addresses: [], // if your API returns addresses separately, fetch/set here
        });

      } catch (error) {
        setProfileError(error.response?.data?.message || error.message || "Failed to fetch profile");
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, []);
  // console.log(userId, "::user id")
  // Start inline editing a field
  function startInlineEdit(section, field, index = null) {
    const key = keyFor(section, field, index);
    if (editStates[key]?.saved) {
      setEditStates((prev) => ({ ...prev, [key]: { saved: false, submitting: false } }));
    }
    setInlineEditField({ section, field, index });
    if (section === "personal") setInlineEditValue(profileData.personal[field] || "");
    else if (section === "addresses" && index !== null) setInlineEditValue(profileData.addresses[index][field] || "");
  }
  const userId = profileData.personal.userId;

  // Cancel inline edit
  function cancelInlineEdit() {
    setInlineEditField({ section: null, field: null, index: null });
    setInlineEditValue("");
  }

  // Save inline edit with PATCH API call
  async function saveInlineEdit() {
    if (inlineEditValue.trim() === "") {
      alert("Value cannot be empty");
      return;
    }
    const { section, field, index } = inlineEditField;
    const key = keyFor(section, field, index);

    setEditStates((prev) => ({ ...prev, [key]: { submitting: true, saved: false } }));

    try {
      if (!userId) {
        alert("User ID is missing. Please try again.");
        return;
      }
      let response;
      if (section === "personal") {
        // PATCH personal details
        const token = sessionStorage.getItem("accessToken");
        response = await axios.patch(`http://localhost:8000/user/v1/update_user/${userId}`, { [field]: inlineEditValue }, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
      } else if (section === "addresses" && index !== null) {
        // We expect each address has an identifier like id to PATCH it individually
        const address = profileData.addresses[index];
        if (!address.id) {
          throw new Error("Address id missing, unable to update");
        }
        response = await axios.patch(`/api/profile/address/${address.id}`, { [field]: inlineEditValue });
      } else {
        throw new Error("Invalid section or index");
      }
      if (response.status !== 200) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      // Update local profile state after successful PATCH
      setProfileData((prev) => {
        if (section === "personal") {
          return {
            ...prev,
            personal: {
              ...prev.personal,
              [field]: inlineEditValue,
            },
          };
        } else if (section === "addresses" && index !== null) {
          const newAddresses = [...prev.addresses];
          newAddresses[index] = { ...newAddresses[index], [field]: inlineEditValue };
          return { ...prev, addresses: newAddresses };
        }
        return prev;
      });

      setEditStates((prev) => ({
        ...prev,
        [key]: { submitting: false, saved: true },
      }));
      cancelInlineEdit();

      // Clear saved state after 3 seconds so user can edit again
      setTimeout(() => {
        setEditStates((prev) => ({
          ...prev,
          [key]: { submitting: false, saved: false },
        }));
      }, 3000);
    } catch (error) {
      setEditStates((prev) => ({
        ...prev,
        [key]: { submitting: false, saved: false },
      }));
      alert(error.response?.data?.message || error.message || "Update failed");
    }
  }

  // Field input component used in inline editing
  function FieldInput({ type }) {
    return (
      <input
        type={type === "password" ? "password" : type === "email" ? "email" : "text"}
        autoFocus
        value={inlineEditValue}
        onChange={(e) => setInlineEditValue(e.target.value)}
        onBlur={() => {
          saveInlineEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            saveInlineEdit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancelInlineEdit();
          }
        }}
        className="border border-orange-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full bg-orange-50 text-sm"
      />
    );
  }

  // Card component rendering personal or address fields (for one address)
  function InfoCard({ title, fields, section, index = null, addressData = null }) {
    return (
      <div className="bg-orange-50 border border-orange-400 rounded-xl p-4 shadow-md w-full">
        {title && <h2 className="text-lg font-bold mb-4 text-orange-700">{title}</h2>}
        <div className="grid grid-cols-1 gap-3">
          {fields.map(({ field, label, type }) => {
            const isEditing =
              inlineEditField.section === section &&
              inlineEditField.field === field &&
              inlineEditField.index === index;
            const value =
              section === "personal"
                ? profileData.personal[field] || ""
                : addressData
                  ? addressData[field] || ""
                  : "";
            const key = keyFor(section, field, index);
            const { submitting, saved } = editStates[key] || {};

            return (
              <div
                key={field}
                className="relative group py-2 px-3 rounded-lg hover:bg-orange-100 cursor-default"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isEditing && !saved && !submitting) {
                    e.preventDefault();
                    startInlineEdit(section, field, index);
                  }
                }}
              >
                <label className="font-semibold text-orange-700 block mb-1 text-sm">{label}</label>
                {isEditing ? (
                  <FieldInput type={type} />
                ) : (
                  <p className="text-orange-900 mt-1 select-text text-sm">
                    {type === "password" && value ? "********" : value || "-"}
                  </p>
                )}
                {!isEditing && (
                  <>
                    {!saved && !submitting && (
                      <button
                        tabIndex={-1}
                        aria-label={`Edit ${label}`}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 hover:text-orange-700"
                        onClick={() => startInlineEdit(section, field, index)}
                        type="button"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                {isEditing && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={saveInlineEdit}
                      disabled={submitting}
                      className={`transition-opacity ${submitting ? "opacity-50 animate-pulse" : "opacity-100"
                        } text-green-600 hover:text-green-700`}
                      aria-label={submitting ? "Saving" : "Save"}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {saved && !isEditing && (
                  <div
                    className="absolute top-2 right-2 text-green-600 transition-opacity"
                    aria-label="Saved"
                    role="img"
                  >
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }


  const personalFields = [
    { field: "email", label: "Email", type: "email" },
    { field: "firstName", label: "First Name", type: "text" },
    { field: "lastName", label: "Last Name", type: "text" },
    { field: "phoneNumber", label: "Phone Number", type: "text" },
  ];

  const addressFields = [
    { field: "label", label: "Label", type: "text" },
    { field: "streetAddress", label: "Street Address", type: "text" },
    { field: "city", label: "City", type: "text" },
    { field: "state", label: "State", type: "text" },
    { field: "postalCode", label: "Postal Code", type: "text" },
    { field: "countryCode", label: "Country Code", type: "text" },
    { field: "landmark", label: "Landmark", type: "text" },
  ];

  // Handle address form input change
  function handleNewAddressChange(field, value) {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  }

  // Submit new address with backend POST
  async function handleAddAddress() {
    if (!newAddress.label.trim()) return alert("Address label is required");
    if (!newAddress.streetAddress.trim()) return alert("Street Address is required");

    try {
      const response = await axios.post("/api/profile/address", newAddress);
      if (response.status !== 201 && response.status !== 200) {
        throw new Error("Failed to add new address");
      }
      // Assuming backend returns the saved address with ID
      setProfileData((prev) => ({
        ...prev,
        addresses: [...prev.addresses, response.data],
      }));
      setNewAddress({
        label: "",
        streetAddress: "",
        city: "",
        state: "",
        postalCode: "",
        countryCode: "",
        landmark: "",
      });
      setAddingAddress(false);
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Could not add address");
    }
  }

  // Password change handlers - replace with backend call as needed
  function handleInputChange(e) {
    const { name, value } = e.target;
    setPasswordInputs((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors) setPasswordErrors("");
    if (passwordSuccess) setPasswordSuccess("");
  }




async function handlePasswordChangeSubmit() {
  const { currentPassword, newPassword, confirmPassword } = passwordInputs;

  // Basic validations
  if (!currentPassword) {
    setPasswordErrors("Current password is required");
    toast.error("Current password is required");
    return;
  }

  if (!newPassword) {
    setPasswordErrors("New password is required");
    toast.error("New password is required");
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordErrors("New password and confirmation do not match");
    toast.error("New password and confirmation do not match");
    return;
  }

  // Password strength validation
  const validations = [
    { test: /.{6,}/, message: "Password must be at least 6 characters" },
    { test: /[A-Z]/, message: "Password must include at least one uppercase letter" },
    { test: /[a-z]/, message: "Password must include at least one lowercase letter" },
    { test: /[0-9]/, message: "Password must include at least one number" },
    { test: /[!@#$%^&*(),.?":{}|<>]/, message: "Password must include at least one special character" },
    { test: /^\S*$/, message: "Password must not contain spaces" },
  ];

  for (const rule of validations) {
    if (!rule.test.test(newPassword)) {
      setPasswordErrors(rule.message);
      toast.error(rule.message);
      return;
    }
  }

  setPasswordErrors("");
  setPasswordSuccess("");

  try {
    const token = sessionStorage.getItem("accessToken");
    const response = await axios.patch(
      `http://localhost:8000/user/v1/update_user/${userId}`,
      {
        current_password: currentPassword,
        password: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Password change failed");
    }

    toast.success("Password changed successfully!");
    setPasswordSuccess("Password changed successfully!");
    setPasswordInputs({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Password change failed";
    setPasswordErrors(message);
    toast.error(message);
  }
}


  if (loadingProfile)
    return (
      <div className="min-h-screen p-4 flex items-center justify-center text-orange-700">
        Loading profile...
      </div>
    );

  if (profileError)
    return (
      <div className="min-h-screen p-4 flex items-center justify-center text-red-700">
        Error loading profile: {profileError}
      </div>
    );

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      <div className="max-w-full mx-auto">
        {/* Menu buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveMenu("personal")}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${activeMenu === "personal"
              ? "bg-orange-500 text-white shadow-lg"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
              }`}
            type="button"
            aria-current={activeMenu === "personal" ? "page" : undefined}
          >
            <User className="w-4 h-4" />
            Personal Details
          </button>
          <button
            onClick={() => setActiveMenu("address")}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${activeMenu === "address"
              ? "bg-orange-500 text-white shadow-lg"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
              }`}
            type="button"
            aria-current={activeMenu === "address" ? "page" : undefined}
          >
            <MapPin className="w-4 h-4" />
            Address Details
          </button>
        </div>

        {/* Active menu content */}
        {activeMenu === "personal" && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Custom Personal Details Card Header with user type tag */}
              <div className="bg-orange-50 border border-orange-400 rounded-xl p-4 shadow-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-orange-700">Personal Details</h2>
                  {profileData.personal?.userType && (
                    <UserTypeTag userType={profileData.personal.userType} />
                  )}
                </div>
                {/* Render the InfoCard fields below header without title (pass no title prop or adjust InfoCard) */}
                <InfoCard fields={personalFields} section="personal" />
              </div>

              <PasswordChangeSection
                passwordInputs={passwordInputs}
                onInputChange={handleInputChange}
                onSubmit={handlePasswordChangeSubmit}
                passwordErrors={passwordErrors}
                passwordSuccess={passwordSuccess}
              />
            </div>
          </div>
        )}

        {activeMenu === "address" && (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setAddingAddress((prev) => !prev)}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </button>
            </div>

            {/* Add address form, toggle visibility */}
            {addingAddress && (
              <div className="bg-orange-50 border border-orange-400 rounded-xl p-4 shadow-md mb-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-4 text-orange-700">New Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addressFields.map(({ field, label, type }) => (
                    <div key={field} className="">
                      <label className="font-semibold text-orange-700 mb-1 block text-sm" htmlFor={`newAddress_${field}`}>
                        {label}
                      </label>
                      <input
                        id={`newAddress_${field}`}
                        type={type === "email" ? "email" : "text"}
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
                    onClick={() => {
                      setAddingAddress(false);
                      setNewAddress({
                        label: "",
                        streetAddress: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        countryCode: "",
                        landmark: "",
                      });
                    }}
                    className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg shadow-md hover:bg-orange-200 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 transition text-sm"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            )}

            {/* Render existing addresses in cards */}
            {profileData.addresses.length === 0 && (
              <p className="text-orange-700 font-semibold text-center text-sm">No addresses added yet.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profileData.addresses.map((address, index) => (
                <InfoCard
                  key={address.id || index}
                  title={`${address.label || "Address"}`}
                  fields={addressFields}
                  section="addresses"
                  index={index}
                  addressData={address}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserTypeTag({ userType }) {
  const userTypeMap = {
    importer_exporter: {
      label: "Importer Exporter",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
    },
    supplier: {
      label: "Supplier",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
    },
    super_admin: {
      label: "Super Admin",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
    },
  };

  const typeInfo = userTypeMap[userType] || {
    label: userType.replace(/_/g, " "),
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full font-semibold text-xs uppercase tracking-wide select-none ${typeInfo.bgColor} ${typeInfo.textColor}`}
      aria-label={`User type: ${typeInfo.label}`}
      role="text"
    >
      {typeInfo.label}
    </span>
  );
}
// PasswordChangeSection and supporting components with smaller styling
function PasswordChangeSection({ passwordInputs, onInputChange, onSubmit, passwordErrors, passwordSuccess }) {
  return (
    <div className="bg-orange-50 border border-orange-400 rounded-xl p-4 w-full shadow-md">
      <h2 className="text-lg font-bold mb-4 text-orange-700">Change Password</h2>
      <div className="flex flex-col gap-4">
        <FormField label="Current Password" htmlFor="currentPassword">
          <OrangeBoxInput
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={passwordInputs.currentPassword}
            onChange={onInputChange}
          />
        </FormField>
        <FormField label="New Password" htmlFor="newPassword">
          <OrangeBoxInput
            id="newPassword"
            name="newPassword"
            type="password"
            value={passwordInputs.newPassword}
            onChange={onInputChange}
          />
        </FormField>
        <FormField label="Confirm Password" htmlFor="confirmPassword">
          <OrangeBoxInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={passwordInputs.confirmPassword}
            onChange={onInputChange}
          />
        </FormField>

        {passwordErrors && <p className="text-red-700 font-semibold text-sm">{passwordErrors}</p>}
        {passwordSuccess && <p className="text-green-700 font-semibold text-sm">{passwordSuccess}</p>}

        <button
          type="button"
          onClick={onSubmit}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 shadow-md transition text-sm"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}

function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="font-semibold text-orange-700 mb-1 block text-sm">
        {label}
      </label>
      {children}
    </div>
  );
}

function OrangeBoxInput({ id, name, type, value, onChange }) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full border border-orange-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50 text-sm"
      autoComplete="new-password"
    />
  );
}