// Phone input that accepts only 10 digits and auto-formats as XXXXX XXXXX
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return digits.slice(0, 5) + " " + digits.slice(5);
};

const PhoneInput = ({ value, onChange, placeholder, className, style, ...props }) => {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange({ target: { value: raw } });
  };
  const display = formatPhone(value || "");

  return (
    <input
      type="tel"
      inputMode="numeric"
      placeholder={placeholder || "99999 99999"}
      className={className}
      style={style}
      value={display}
      onChange={handleChange}
      {...props}
    />
  );
};

export default PhoneInput;