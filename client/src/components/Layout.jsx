import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '首页', icon: '📊' },
    { path: '/users', label: '账号管理', icon: '👤' },
    { path: '/teachers', label: '教师管理', icon: '👨‍🏫' },
    { path: '/course-types', label: '课程类型', icon: '🎵' },
    { path: '/students', label: '学生管理', icon: '👨‍🎓' },
    { path: '/courses', label: '课时管理', icon: '⏱️' },
    { path: '/transactions', label: '财务管理', icon: '💰' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 侧边栏 */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-gray-800 text-white transition-all duration-300 flex flex-col`}>
        {/* 标题 */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <h1 className={`font-bold text-lg ${sidebarOpen ? '' : 'hidden'}`}>🎹 琴行管理</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 mx-2 rounded-lg transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 用户信息 */}
        <div className="p-4 border-t border-gray-700">
          <div className={`flex items-center ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.username}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}