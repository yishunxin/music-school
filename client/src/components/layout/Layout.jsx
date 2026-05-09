import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Music } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="md:ml-56 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            {/* Mobile Logo */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-800">琴行管理</span>
            </div>

            {/* Page Title (mobile hidden, shown via route) */}

            {/* User Info */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{user?.username || '用户'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
