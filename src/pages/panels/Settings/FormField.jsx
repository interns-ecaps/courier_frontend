export default function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="font-semibold text-orange-700 mb-1 block text-sm">
        {label}
      </label>
      {children}
    </div>
  );
}
