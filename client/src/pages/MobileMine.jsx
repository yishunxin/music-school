import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, LogOut, User as UserIcon, Shield } from 'lucide-react';

export default function MobileMine() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: UserIcon, label: '账号设置', color: 'text-gray-600' },
    { icon: Settings, label: '系统设置', color: 'text-gray-600' },
  ];

  return (
    <div className="pb-24">
      {/* Header - 紫色渐变设计,头像居中 + 用户名 + 角色 */}
      <div
        className="px-5 pt-10 pb-20 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 border-[3px] border-white/30 mb-4">
          <span className="text-3xl font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || 'A'}
          </span>
        </div>
        <h2 className="text-xl font-semibold mb-1">{user?.username || '管理员'}</h2>
        <p className="text-sm text-indigo-100">
          {user?.role === 'super_admin' ? '超级管理员' : user?.role === 'admin' ? '系统管理员' : '普通用户'}
        </p>
      </div>

      {/* Menu - 白色圆角卡片,上移覆盖在 header 之上 */}
      <div className="px-4 -mt-14">
        <div
          className="bg-white overflow-hidden"
          style={{ borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        >
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`w-full flex items-center gap-3.5 py-4 px-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  idx < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="flex-1 text-left text-[15px] text-gray-800 font-medium">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout - 整行红色按钮 */}
      <div className="px-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#FEF2F2] rounded-2xl text-[#EF4444] active:opacity-80 transition-opacity"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-[15px]">退出登录</span>
        </button>
      </div>

      {/* Version */}
      <p className="text-center text-gray-400 text-xs mt-6">
        琴行管理系统 v2.0
      </p>
    </div>
  );
}
