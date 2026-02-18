import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="layout__nav">
        <button className="layout__brand" onClick={() => navigate('/dashboard')}>
          Chain<span className="layout__brand-accent">Chaser</span>
        </button>

        {user && (
          <div className="layout__user">
            <span className="layout__user-name">{user.name}</span>
            <button className="layout__logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </nav>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
