export default function Input({ label, error, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className={`input ${error ? 'input-error' : ''}`} {...props} />
      {error && <small className="error-text">{error}</small>}
    </label>
  );
}
