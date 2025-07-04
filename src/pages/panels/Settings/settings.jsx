import { Edit2, Check, Plus, User, MapPin } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  // Profile data with personal and multiple addresses details
  const [profileData, setProfileData] = useState({
    personal: {
      email: "user@example.com",
      firstName: "User",
      lastName: "Example",
      phoneNumber: "+1234567890",
    },
    addresses: [
      {
        label: "Home",
        streetAddress: "123 Main St",
        city: "Springfield",
        state: "IL",
        postalCode: "62704",
        countryCode: "US",
        landmark: "Near park",
      },
    ],
  });

  // State to track which menu is active: "personal" or "address"
  const [activeMenu, setActiveMenu] = useState("personal");

  // Track edit states per field: { section_index_field: editedBoolean, section_index_field_submittingBoolean }
  // For personal fields index will be null or 0, for addresses index is number
  const [editStates, setEditStates] = useState({});

  // Inline editing state: section ('personal' or 'addresses'), field, and index (for addresses)
  const [inlineEditField, setInlineEditField] = useState({ section: null, field: null, index: null });
  const [inlineEditValue, setInlineEditValue] = useState("");

  // Edit all mode and edit all index/value are not changed as we now handle per menu with inline only

  // Password change inputs state kept same
  const [passwordInputs, setPasswordInputs] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Helper key for editStates, separate by index for addresses
  function keyFor(section, field, index = null) {
    return index !== null ? `${section}_${index}_${field}` : `${section}_${field}`;
  }

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

  // Cancel inline edit
  function cancelInlineEdit() {
    setInlineEditField({ section: null, field: null, index: null });
    setInlineEditValue("");
  }

  // Save inline edit
  function saveInlineEdit() {
    if (inlineEditValue.trim() === "") {
      alert("Value cannot be empty");
      return;
    }
    const { section, field, index } = inlineEditField;
    const key = keyFor(section, field, index);

    setEditStates((prev) => ({ ...prev, [key]: { submitting: true, saved: false } }));

    setTimeout(() => {
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
      setTimeout(() => {
        setEditStates((prev) => ({
          ...prev,
          [key]: { submitting: false, saved: false },
        }));
      }, 3000);
    }, 1000);
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
        <h2 className="text-lg font-bold mb-4 text-orange-700">{title}</h2>
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
                    {(saved || submitting) && (
                      <div
                        className={`absolute top-2 right-2 transition-opacity ${
                          submitting ? "opacity-50 animate-pulse" : "opacity-100"
                        } text-green-600`}
                        aria-label={submitting ? "Saving" : "Saved"}
                        role="img"
                      >
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </>
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

  // Handle address form input change
  function handleNewAddressChange(field, value) {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  }

  // Submit new address
  function handleAddAddress() {
    // Basic validation: at least label and streetAddress required
    if (!newAddress.label.trim()) return alert("Address label is required");
    if (!newAddress.streetAddress.trim()) return alert("Street Address is required");

    setProfileData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, newAddress],
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
  }

  // Password change handlers and components kept same
  function handleInputChange(e) {
    const { name, value } = e.target;
    setPasswordInputs((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors) setPasswordErrors("");
    if (passwordSuccess) setPasswordSuccess("");
  }

  function handlePasswordChangeSubmit(e) {
    if (!passwordInputs.currentPassword) {
      setPasswordErrors("Current password is required");
      return;
    }
    if (!passwordInputs.newPassword) {
      setPasswordErrors("New password is required");
      return;
    }
    if (passwordInputs.newPassword !== passwordInputs.confirmPassword) {
      setPasswordErrors("New password and confirmation do not match");
      return;
    }
    setPasswordErrors("");
    setPasswordSuccess("");
    setTimeout(() => {
      setPasswordSuccess("Password changed successfully!");
      setPasswordInputs({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }, 1000);
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {/* <h1 className="text-3xl font-bold text-orange-700 mb-2">Settings</h1> */}
          {/* <p className="text-orange-600">Manage your personal information and preferences</p> */}
        </div>

        {/* Menu buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveMenu("personal")}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
              activeMenu === "personal"
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
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
              activeMenu === "address"
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
              <InfoCard title="Personal Details" fields={personalFields} section="personal" />
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
                  key={index}
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