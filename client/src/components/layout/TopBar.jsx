import { Link } from 'react-router-dom';
import { Menu, Piano } from 'lucide-react';

export default function TopBar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4">
        {/* 左侧：菜单按钮 + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-lg flex items-center justify-center">
              <Piano className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 hidden sm:block">琴行管理</span>
          </Link>
        </div>

        {/* 右侧：用户信息 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full flex items-center justify-center text-white text-sm font-semibold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
