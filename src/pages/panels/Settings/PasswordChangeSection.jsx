import { Check } from "lucide-react";
import OrangeBoxInput from "./OrangeBoxInput.jsx";
import React from "react";

const requirements = [
  {
    label: "At least 6 characters",
    test: (pw) => pw.length >= 6,
  },
  {
    label: "At least 1 upper case letter (A-Z)",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    label: "At least 1 lower case letter (a-z)",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    label: "At least 1 number (0-9)",
    test: (pw) => /[0-9]/.test(pw),
  },
];

export default function PasswordChangeSection({
  passwordInputs,
  onInputChange,
  onSubmit,
  passwordErrors,
  passwordSuccess,
  onCancel,
}) {
  const newPassword = passwordInputs.newPassword || "";
  const confirmPassword = passwordInputs.confirmPassword || "";
  const currentPassword = passwordInputs.currentPassword || "";
  const allValid = requirements.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="p-8 w-full max-w-4xl min-w-[520px]">
      <div className="flex flex-col md:flex-row gap-8 items-stretch min-h-[320px]">
        {/* Left: Requirements */}
        <div className="flex-1 min-w-[200px] flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold mb-6 text-gray-900">Change Password</h2>
          <div className="text-gray-400 text-base mb-2 font-semibold">Passwords must contain:</div>
          <ul className="space-y-2 mb-4">
            {requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className={`w-5 h-5 ${req.test(newPassword) ? "text-green-500" : "text-gray-300"}`} />
                <span className={`text-base ${req.test(newPassword) ? "text-green-600 font-semibold" : "text-gray-400"}`}>{req.label}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Right: Fields */}
        <div className="flex-1 flex flex-col justify-center gap-5 min-w-[220px]">
          <div className="relative">
            <label htmlFor="currentPassword" className="block text-gray-700 font-semibold mb-1">Current Password</label>
            <div className="relative">
              <OrangeBoxInput
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={onInputChange}
                placeholder="Current Password"
              />
              {currentPassword && (
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
              )}
            </div>
          </div>
          <div className="relative">
            <label htmlFor="newPassword" className="block text-gray-700 font-semibold mb-1">New Password</label>
            <div className="relative">
              <OrangeBoxInput
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={onInputChange}
                placeholder="New Password"
              />
              {allValid && newPassword && (
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
              )}
            </div>
          </div>
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-1">Confirm Password</label>
            <div className="relative">
              <OrangeBoxInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={onInputChange}
                placeholder="Confirm Password"
              />
              {passwordsMatch && (
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
              )}
            </div>
          </div>
          {passwordErrors && (
            <p className="text-red-700 font-semibold text-sm mt-1" role="alert" aria-live="assertive">
              {passwordErrors}
            </p>
          )}
          {passwordSuccess && (
            <p className="text-green-700 font-semibold text-sm mt-1" role="status" aria-live="polite">
              {passwordSuccess}
            </p>
          )}
          <div className="mt-6" />
          <button
            type="button"
            onClick={onSubmit}
            className={`w-full bg-orange-500 text-white px-4 py-3 rounded-md hover:bg-orange-600 shadow transition text-lg font-bold tracking-wide ${!allValid || !passwordsMatch ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={!allValid || !passwordsMatch}
          >
            SAVE
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-gray-400 hover:text-gray-600 text-base mt-3 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
