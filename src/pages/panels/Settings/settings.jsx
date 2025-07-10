import { Edit2, Check, Plus, User, MapPin, Lock } from "lucide-react";
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

  // Show password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
        const sessionUser = JSON.parse(sessionStorage.getItem("user"));
        const userId = sessionUser?.id || sessionUser?.user_id;
        const user = response.data.results.find(u => u.id === userId);
        if (!user) throw new Error("Logged-in user not found in response");

        // Reshape to expected front-end shape:
        setProfileData({
          personal: {
            userId: user.id,
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
  console.log(sessionStorage.getItem("userId"));
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
                    {type === "password" && value ? "" : value || "-"}
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
    // Robust userId extraction
    let userId = profileData.personal.userId;
    if (!userId) {
      // Try to get from session user object
      const sessionUser = JSON.parse(sessionStorage.getItem("user"));
      userId = sessionUser?.id || sessionUser?.user_id;
    }
    if (!userId) {
      throw new Error("User ID not found. Please re-login.");
    }
    const response = await axios.patch(
      `http://localhost:8000/user/v1/update_user/${userId}`,
      {
        current_password: currentPassword,
        password: newPassword,
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
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
    setShowPasswordModal(false); // Close modal on success
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Password change failed";
    setPasswordErrors(message);
    toast.error(message);
  }
}

  // Save the entire profile form
  async function handleSaveProfile(e) {
    e.preventDefault();
    const { firstName, lastName, email, phoneNumber, userId } = profileData.personal;
    // Basic validation
    if (!firstName || !lastName || !email || !phoneNumber) {
      toast.error("All fields are required");
      return;
    }
    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await axios.patch(
        `http://localhost:8000/user/v1/update_user/${userId}`,
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phoneNumber,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to update profile");
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
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex flex-col items-center pt-8">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-orange-100 p-10 flex flex-col">
        <div className="relative flex items-center mb-10">
          {/* Super Admin Badge Top Right */}
          {profileData.personal.userType && (
            <span className="absolute right-0 top-0 mt-2 mr-2 px-4 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs uppercase tracking-wide shadow z-10">
              {profileData.personal.userType}
            </span>
          )}
          <div className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center text-4xl font-bold text-orange-700 shadow-lg mr-8 flex-shrink-0">
            {profileData.personal.firstName?.[0] || ''}{profileData.personal.lastName?.[0] || ''}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-orange-700 mb-1">Personal information</h1>
            {/* Optionally, add a status or subtitle here */}
          </div>
        </div>
        <form className="w-full" onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-10">
            <div>
              <label className="block text-orange-700 font-semibold mb-2">First Name</label>
              <input
                type="text"
                value={profileData.personal.firstName}
                onChange={e => setProfileData(prev => ({ ...prev, personal: { ...prev.personal, firstName: e.target.value } }))}
                className="w-full rounded-full border border-orange-200 px-6 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-2">Last Name</label>
              <input
                type="text"
                value={profileData.personal.lastName}
                onChange={e => setProfileData(prev => ({ ...prev, personal: { ...prev.personal, lastName: e.target.value } }))}
                className="w-full rounded-full border border-orange-200 px-6 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.personal.email}
                onChange={e => setProfileData(prev => ({ ...prev, personal: { ...prev.personal, email: e.target.value } }))}
                className="w-full rounded-full border border-orange-200 px-6 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-2">Phone Number</label>
              <div className="flex gap-2">
                <select className="rounded-full border border-orange-200 px-4 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none">
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  {/* Add more as needed */}
                </select>
                <input
                  type="text"
                  value={profileData.personal.phoneNumber}
                  onChange={e => setProfileData(prev => ({ ...prev, personal: { ...prev.personal, phoneNumber: e.target.value } }))}
                  className="flex-1 rounded-full border border-orange-200 px-6 py-3 bg-orange-50 text-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-8 gap-4">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-full px-10 py-4 shadow-lg transition"
            >
              Save Changes
            </button>
            <button
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-full px-10 py-4 shadow-lg transition"
              onClick={() => setShowPasswordModal(true)}
            >
              Change password
            </button>
          </div>
        </form>
      </div>
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-orange-100/40">
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] md:w-[700px] max-w-2xl max-h-[90vh] overflow-y-auto relative flex items-center justify-center border border-orange-100">
            <button
              className="absolute top-4 right-6 text-orange-400 hover:text-orange-700 text-2xl font-bold z-10"
              onClick={() => setShowPasswordModal(false)}
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className="w-full flex flex-col md:flex-row items-stretch justify-center p-0 md:p-8 gap-0 md:gap-8 min-h-[340px]">
              {/* Left: Requirements */}
              <div className="flex-1 min-w-[220px] flex flex-col justify-center px-8 py-8 md:py-0 border-b md:border-b-0 md:border-r border-orange-100">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-orange-700">Change Password</h2>
                <div className="text-orange-400 text-base mb-2 font-semibold">Passwords must contain:</div>
                <ul className="space-y-2 mb-4">
                  {[
                    { label: "At least 6 characters", test: /.{6,}/ },
                    { label: "At least 1 upper case letter (A-Z)", test: /[A-Z]/ },
                    { label: "At least 1 lower case letter (a-z)", test: /[a-z]/ },
                    { label: "At least 1 number (0-9)", test: /[0-9]/ },
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className={`w-5 h-5 ${req.test.test(passwordInputs.newPassword) ? "text-green-500" : "text-orange-200"}`} />
                      <span className={`${req.test.test(passwordInputs.newPassword) ? "text-orange-700 font-semibold" : "text-orange-300"}`}>{req.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Right: Fields */}
              <div className="flex-1 flex flex-col justify-center gap-5 min-w-[260px] px-8 py-8 md:py-0">
                {[{
                  name: "currentPassword",
                  label: "Current Password",
                  value: passwordInputs.currentPassword,
                  valid: !!passwordInputs.currentPassword,
                }, {
                  name: "newPassword",
                  label: "New Password",
                  value: passwordInputs.newPassword,
                  valid: [/.{6,}/, /[A-Z]/, /[a-z]/, /[0-9]/].every(r => r.test(passwordInputs.newPassword)),
                }, {
                  name: "confirmPassword",
                  label: "Confirm Password",
                  value: passwordInputs.confirmPassword,
                  valid: passwordInputs.newPassword && passwordInputs.confirmPassword && passwordInputs.newPassword === passwordInputs.confirmPassword,
                }].map((field, idx) => (
                  <div key={field.name} className="relative mb-2">
                    <label htmlFor={field.name} className="block text-orange-700 font-semibold mb-1 text-sm">{field.label}</label>
                    <input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.value}
                      onChange={handleInputChange}
                      placeholder={field.label}
                      className="w-full border border-orange-300 rounded-lg px-4 py-3 bg-orange-50 focus:ring-2 focus:ring-orange-400 transition text-base pr-10"
                      autoComplete={field.name === "currentPassword" ? "current-password" : "new-password"}
                    />
                    {field.valid && (
                      <Check className="absolute right-3 top-[70%] -translate-y-1/2 text-green-500 w-5 h-5" />
                    )}
                  </div>
                ))}
                {passwordErrors && <p className="text-red-700 font-semibold text-sm mt-1">{passwordErrors}</p>}
                {passwordSuccess && <p className="text-green-700 font-semibold text-sm mt-1">{passwordSuccess}</p>}
                <button
                  type="button"
                  onClick={handlePasswordChangeSubmit}
                  className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 shadow-md transition text-lg font-bold mt-2"
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-full text-orange-400 hover:text-orange-700 text-base mt-2 underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
