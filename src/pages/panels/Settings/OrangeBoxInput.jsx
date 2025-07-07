export default function OrangeBoxInput({ id, name, type, value, onChange }) {
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
