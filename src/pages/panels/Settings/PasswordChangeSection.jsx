import OrangeBoxInput from "./OrangeBoxInput.jsx";
import FormField from "./FormField";

export default function PasswordChangeSection({
  passwordInputs,
  onInputChange,
  onSubmit,
  passwordErrors,
  passwordSuccess,
}) {
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

        {passwordErrors && (
          <p className="text-red-700 font-semibold text-sm" role="alert" aria-live="assertive">
            {passwordErrors}
          </p>
        )}
        {passwordSuccess && (
          <p className="text-green-700 font-semibold text-sm" role="status" aria-live="polite">
            {passwordSuccess}
          </p>
        )}

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
