import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  List,
  Users,
  Wallet
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '首页' },
  { path: '/teachers', icon: GraduationCap, label: '教师' },
  { path: '/course-types', icon: List, label: '课程' },
  { path: '/students', icon: Users, label: '学生' },
  { path: '/transactions', icon: Wallet, label: '财务' },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] rounded-lg transition-all touch-feedback ${
                active
                  ? 'text-[var(--color-primary)]'
                  : 'text-gray-500'
              }`}
            >
              <div className={`
                p-1.5 rounded-lg transition-colors
                ${active ? 'bg-blue-50' : ''}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
