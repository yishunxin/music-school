import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  List,
  Users,
  Wallet,
  UserCircle,
  Music,
  Clock,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '首页概览' },
  { path: '/users', icon: UserCircle, label: '账号管理' },
  { path: '/teachers', icon: GraduationCap, label: '教师管理' },
  { path: '/course-types', icon: Music, label: '课程类型' },
  { path: '/students', icon: Users, label: '学生管理' },
  { path: '/courses', icon: Clock, label: '课时管理' },
  { path: '/transactions', icon: Wallet, label: '财务管理' },
];

export default function Sidebar({ onClose, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    onLogout?.();
    onClose?.();
  };

  const handleNav = () => {
    onClose?.();
  };

  return (
    <aside className="w-60 bg-[#1F2937] text-white flex flex-col h-full">
      {/* 头部 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-lg flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">琴行管理</span>
        </div>

        {/* 移动端关闭按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors md:hidden"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNav}
              className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-base cursor-pointer ${
                isActive(item.path)
                  ? 'active text-white'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
              style={isActive(item.path) ? { background: 'rgba(255,255,255,0.1)' } : {}}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-full flex items-center justify-center text-sm font-semibold">
            {user?.username?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username || 'admin'}</p>
            <p className="text-xs text-gray-400">管理员</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
