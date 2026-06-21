import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import BottomNav from './layout/BottomNav';
import TopBar from './layout/TopBar';

export default function Layout() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // 检测屏幕宽度
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 移动端切换页面时关闭侧边栏
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // 切换侧边栏
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* 桌面端布局 */}
      {!isMobile && (
        <div className="flex min-h-screen">
          {/* 侧边栏 */}
          <Sidebar />
          
          {/* 主内容区 */}
          <main className="flex-1 bg-[var(--color-bg-primary)] overflow-auto">
            <Outlet />
          </main>
        </div>
      )}

      {/* 移动端布局 */}
      {isMobile && (
        <div className="flex flex-col min-h-screen min-h-[100dvh]">
          {/* 顶部导航 */}
          <TopBar onMenuClick={toggleSidebar} />
          
          {/* 侧边栏遮罩 */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* 侧边栏 */}
          <div className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          
          {/* 主内容区 */}
          <main className="flex-1 overflow-auto pb-20 bg-[var(--color-bg-primary)]">
            <Outlet />
          </main>
          
          {/* 底部导航 */}
          <BottomNav />
        </div>
      )}
    </div>
  );
}
