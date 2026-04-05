export default function Select({ label, options, error, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className={`input ${error ? 'input-error' : ''}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <small className="error-text">{error}</small>}
    </label>
  );
}
