import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Welcome to CRM POS</h1>
        <p>Manage sales and customer relationships from one dashboard.</p>
        <Outlet />
      </section>
    </main>
  );
}
