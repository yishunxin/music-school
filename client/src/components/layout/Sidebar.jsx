import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  List,
  Users,
  Wallet,
  UserCircle,
  Music
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '首页' },
  { path: '/teachers', icon: GraduationCap, label: '教师' },
  { path: '/course-types', icon: List, label: '课程' },
  { path: '/students', icon: Users, label: '学生' },
  { path: '/transactions', icon: Wallet, label: '财务' },
];

const bottomItems = [
  { path: '/users', icon: UserCircle, label: '账号' },
];

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="hidden md:flex flex-col w-56 bg-sidebar min-h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg">琴行管理</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive(item.path)
                  ? 'bg-sidebar-active text-white'
                  : 'text-gray-400 hover:text-white hover:bg-sidebar-active/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="px-3 pb-4 border-t border-gray-700 pt-4">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'bg-sidebar-active text-white'
                  : 'text-gray-400 hover:text-white hover:bg-sidebar-active/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
