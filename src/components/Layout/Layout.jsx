import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
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

        <nav className="layout__nav-links" aria-label="Main navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `layout__nav-link${isActive ? ' layout__nav-link--active' : ''}`}>
            Chains
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `layout__nav-link${isActive ? ' layout__nav-link--active' : ''}`}>
            Leaderboard
          </NavLink>
          <NavLink to="/friends" className={({ isActive }) => `layout__nav-link${isActive ? ' layout__nav-link--active' : ''}`}>
            Friends
          </NavLink>
        </nav>

        <div className="layout__actions">
          <button
            className="layout__theme-toggle"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="8" y1="1" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="13.5" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="13.5" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="11.89" y1="11.89" x2="12.95" y2="12.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="12.95" y1="3.05" x2="11.89" y2="4.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="4.11" y1="11.89" x2="3.05" y2="12.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {user && (
            <div className="layout__user">
              <span className="layout__avatar">{(user.name || user.email)[0].toUpperCase()}</span>
              <span className="layout__user-name">{user.name}</span>
              <button className="layout__logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
