import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="pb-20">
          <Outlet />
        </main>
        <BottomNav />

        {/* 移动端侧边栏抽屉 */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-0 left-0 bottom-0 w-64 z-50 animate-slide-in shadow-2xl">
              <Sidebar onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="fixed top-0 left-0 bottom-0 w-60 z-30">
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="ml-60">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
