import { User } from "lucide-react";
import { useState } from "react";
import PasswordChangeSection from "./PasswordChangeSection"; // You already have this
import InfoCard from "../InfoCard";
export default function Settings() {
  const [activeMenu, setActiveMenu] = useState("personal");

  const [profileData, setProfileData] = useState({
    personal: {
      email: user.email || "user@example.com",
      firstName: user.first_name || "User",
      lastName: user.last_name || "Example",
      phoneNumber: user.phone || "+1234567890",
    },
  });

  const [inlineEditField, setInlineEditField] = useState({ section: null, field: null });
  const [inlineEditValue, setInlineEditValue] = useState("");
  const [editStates, setEditStates] = useState({});

  const personalFields = [
    { field: "email", label: "Email", type: "email" },
    { field: "firstName", label: "First Name", type: "text" },
    { field: "lastName", label: "Last Name", type: "text" },
    { field: "phoneNumber", label: "Phone Number", type: "text" },
  ];

  const [passwordInputs, setPasswordInputs] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  function keyFor(section, field) {
    return `${section}_${field}`;
  }

  function startInlineEdit(section, field) {
    const key = keyFor(section, field);
    if (editStates[key]?.saved) {
      setEditStates((prev) => ({ ...prev, [key]: { saved: false, submitting: false } }));
    }
    setInlineEditField({ section, field });
    setInlineEditValue(profileData[section][field] || "");
  }

  function cancelInlineEdit() {
    setInlineEditField({ section: null, field: null });
    setInlineEditValue("");
  }

  function saveInlineEdit() {
    const { section, field } = inlineEditField;
    const key = keyFor(section, field);

    if (!inlineEditValue.trim()) {
      alert("Value cannot be empty");
      return;
    }

    setEditStates((prev) => ({ ...prev, [key]: { submitting: true, saved: false } }));

    setTimeout(() => {
      setProfileData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: inlineEditValue,
        },
      }));
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

  function handleInputChange(e) {
    const { name, value } = e.target;
    setPasswordInputs((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors) setPasswordErrors("");
    if (passwordSuccess) setPasswordSuccess("");
  }

  function handlePasswordChangeSubmit() {
    if (!passwordInputs.currentPassword || !passwordInputs.newPassword) {
      setPasswordErrors("All fields are required");
      return;
    }
    if (passwordInputs.newPassword !== passwordInputs.confirmPassword) {
      setPasswordErrors("Passwords do not match");
      return;
    }

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
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveMenu("personal")}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm ${
              activeMenu === "personal"
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            }`}
          >
            <User className="w-4 h-4" />
            Personal Details
          </button>
        </div>

        {activeMenu === "personal" && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard
                title="Personal Details"
                fields={personalFields}
                section="personal"
                data={profileData.personal}
                inlineEditField={inlineEditField}
                inlineEditValue={inlineEditValue}
                startInlineEdit={startInlineEdit}
                cancelInlineEdit={cancelInlineEdit}
                saveInlineEdit={saveInlineEdit}
                setInlineEditValue={setInlineEditValue}
                editStates={editStates}
              />
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
      </div>
    </div>
  );
}
