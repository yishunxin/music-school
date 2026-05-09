import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Bell, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import Card from '../components/common/Card';

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
    { icon: User, label: '个人信息', onClick: () => {} },
    { icon: Bell, label: '消息通知', onClick: () => {} },
    { icon: HelpCircle, label: '帮助中心', onClick: () => {} },
    { icon: Settings, label: '系统设置', onClick: () => {} },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.username || '用户'}</h2>
            <p className="text-white/70 text-sm mt-1">
              {user?.role === 'admin' ? '管理员' : '普通用户'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <Card>
        <div className="divide-y divide-gray-100">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-gray-800">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>
      </Card>

      {/* Logout */}
      <Card>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-error hover:bg-error/5 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>
      </Card>

      {/* Version */}
      <p className="text-center text-gray-400 text-sm">
        琴行管理系统 v2.0
      </p>
    </div>
  );
}
