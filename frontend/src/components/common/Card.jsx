export default function Card({ title, children, action }) {
  return (
    <section className="card">
      {(title || action) && (
        <header className="card-header">
          {title && <h3>{title}</h3>}
          {action}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
