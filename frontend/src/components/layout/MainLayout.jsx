import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { useAppContext } from '../../context/AppContext';

export default function MainLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAppContext();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>CRM POS</h2>
        <p className="sidebar-user">{user?.fullName || user?.email}</p>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/pos">POS</NavLink>
          <NavLink to="/crm">CRM</NavLink>
        </nav>
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
