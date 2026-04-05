export default function Button({ children, type = 'button', variant = 'primary', ...props }) {
  return (
    <button className={`btn btn-${variant}`} type={type} {...props}>
      {children}
    </button>
  );
}
