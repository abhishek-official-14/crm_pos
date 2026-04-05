import { NavLink, Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>CRM POS</h2>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/pos">POS</NavLink>
          <NavLink to="/crm">CRM</NavLink>
          <NavLink to="/login">Logout</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
