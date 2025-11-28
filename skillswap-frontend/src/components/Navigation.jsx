import { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { useCreditStore } from '../store';
import Logo from './Logo';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export function DesktopNavigation({ user, onLogout }) {
  const location = useLocation();
  const { credits } = useCreditStore();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/skills', label: 'Skills', icon: '🎓' },
    { path: '/find-matches', label: 'Find Match', icon: '🤝' },
    { path: '/sessions', label: 'Sessions', icon: '📅' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="bg-gradient-to-r from-primary-900 to-primary-700 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo size="md" showText={false} />
          <div>
            <h1 className="text-xl font-bold">SkillSwap</h1>
            <p className="text-xs opacity-75">Exchange Skills, Unlock Potential</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive ? 'bg-accent-500 text-white' : 'hover:bg-primary-600'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="flex items-center gap-3 pl-8 border-l border-primary-600">
            <div className="text-right">
              <p className="font-semibold text-sm">{user?.displayName}</p>
              <p className="text-xs opacity-75">Credits: <span className="font-bold">{credits}</span></p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-accent-500 rounded-lg hover:bg-accent-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function MobileNavigation({ user, onLogout }) {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/skills', label: 'Skills', icon: '🎓' },
    { path: '/find-matches', label: 'Match', icon: '🤝' },
    { path: '/sessions', label: 'Sessions', icon: '📅' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <>
      <div className="h-16"></div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-1 flex-1 h-full transition ${isActive ? 'text-primary-600 border-t-2 border-primary-600' : 'text-gray-500'}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
