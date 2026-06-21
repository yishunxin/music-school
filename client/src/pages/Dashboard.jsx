import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Clock,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Zap,
  PlusCircle,
  ClipboardCheck,
  UserPlus,
  Music2,
  BarChart3,
  TrendingDown,
  ArrowRight,
  Wallet,
  CreditCard
} from 'lucide-react';
import { students, teachers, courseTypes } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    totalHours: 0,
    todayHours: 0,
  });
  const [finance, setFinance] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  });
  const [lowBalanceStudents, setLowBalanceStudents] = useState([]);
  const [courseStats, setCourseStats] = useState({
    rechargeCount: 0,
    soldHours: 0,
    usedHours: 0,
    remainingHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, teachersRes, courseTypesRes] = await Promise.all([
        students.list(),
        teachers.list(),
        courseTypes.list(),
      ]);

      const allStudents = studentsRes.data || [];
      const allTeachers = teachersRes.data || [];
      const allCourseTypes = courseTypesRes.data || [];

      // 计算总剩余课时
      const totalHours = allStudents.reduce((sum, s) => {
        return sum + (s.courses_summary?.reduce((cs, c) => cs + (c.remaining_hours || 0), 0) || 0);
      }, 0);

      // 计算课时不足的学生
      const lowBalance = allStudents.filter((s) =>
        s.courses_summary?.some(c => c.remaining_hours <= 1)
      ).map(s => ({
        ...s,
        lowestCourse: s.courses_summary?.find(c => c.remaining_hours <= 1)
      }));

      setStats({
        students: allStudents.length,
        teachers: allTeachers.length,
        courses: allCourseTypes.length,
        totalHours,
        todayHours: 0,
      });

      setLowBalanceStudents(lowBalance);

      // 模拟财务数据
      setFinance({
        totalIncome: 38600,
        totalExpense: 26020,
        netProfit: 12580,
      });

      // 模拟课时统计数据
      setCourseStats({
        rechargeCount: 42,
        soldHours: 680,
        usedHours: 224,
        remainingHours: totalHours || 456,
      });
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: PlusCircle, label: '课时充值', path: '/courses', color: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: ClipboardCheck, label: '上课签到', path: '/courses', color: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: UserPlus, label: '学生管理', path: '/students', color: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: GraduationCap, label: '教师管理', path: '/teachers', color: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { icon: Music2, label: '课程类型', path: '/course-types', color: 'bg-pink-50', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { icon: TrendingUp, label: '工资管理', path: '/transactions', color: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  ];

  return (
    <div className="pb-6">
      {/* 桌面端标题区域 */}
      <div className="hidden md:block px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">首页概览</h1>
            <p className="text-gray-500 mt-1">欢迎回来,{user?.username || 'admin'}</p>
          </div>
        </div>
      </div>

      {/* 移动端蓝色渐变头部 - 高度加大,放下4个毛玻璃统计卡 */}
      <div className="md:hidden bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 pt-6 pb-20">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 pr-3">
            <p className="text-sm text-blue-100 mb-1">下午好 👋</p>
            <h1 className="text-2xl font-bold text-white leading-tight">琴行管理系统</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/20">
            <div className="text-[11px] text-blue-100 mb-1">学生总数</div>
            <div className="text-2xl font-bold text-white">{loading ? '-' : stats.students}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/20">
            <div className="text-[11px] text-blue-100 mb-1">本月收入</div>
            <div className="text-2xl font-bold text-white">¥{loading ? '-' : stats.students > 0 ? finance.totalIncome.toLocaleString() : '0'}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/20">
            <div className="text-[11px] text-blue-100 mb-1">待上课</div>
            <div className="text-2xl font-bold text-white">{lowBalanceStudents.length}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/20">
            <div className="text-[11px] text-blue-100 mb-1">教师数</div>
            <div className="text-2xl font-bold text-white">{loading ? '-' : stats.teachers}</div>
          </div>
        </div>
      </div>

      {/* 桌面端统计卡片 */}
      <div className="hidden md:block px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 学生总数 */}
          <div className="bg-white rounded-xl p-5 shadow-sm card-hover cursor-pointer border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">学生总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '-' : stats.students}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />较上月 +3
            </p>
          </div>

          {/* 教师总数 */}
          <div className="bg-white rounded-xl p-5 shadow-sm card-hover cursor-pointer border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">教师总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '-' : stats.teachers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">全部在岗</p>
          </div>

          {/* 剩余总课时 */}
          <div className="bg-white rounded-xl p-5 shadow-sm card-hover cursor-pointer border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">剩余总课时</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '-' : stats.totalHours}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            {lowBalanceStudents.length > 0 && (
              <p className="text-xs text-amber-600 mt-3 bg-amber-50 inline-flex items-center gap-1 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />{lowBalanceStudents.length} 人不足
              </p>
            )}
          </div>

          {/* 本月净利润 */}
          <div className="bg-white rounded-xl p-5 shadow-sm card-hover cursor-pointer border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">本月净利润</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">¥{finance.netProfit.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />较上月 +15%
            </p>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 md:px-6 -mt-12 md:mt-0 space-y-4 md:space-y-6 relative z-10">
        {/* 移动端快捷操作 - 4列布局对齐设计稿(签到/充值/添加学生/工资管理) */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3 mt-1">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#3B82F6]" />
              快捷操作
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {quickActions.slice(0, 4).map((action, idx) => {
              const Icon = action.icon;
              return (
                <div
                  key={idx}
                  className="quick-action flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl shadow-sm"
                  onClick={() => navigate(action.path)}
                >
                  <div className={`w-9 h-9 ${action.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${action.iconColor}`} style={{ width: '18px', height: '18px' }} />
                  </div>
                  <span className="text-[11px] text-gray-600 text-center">{action.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout - 桌面端 */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Balance Warning */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                课时不足提醒
              </h2>
              <button
                onClick={() => navigate('/students')}
                className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {lowBalanceStudents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">暂无课时不足的学生</p>
                </div>
              ) : (
                lowBalanceStudents.slice(0, 3).map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      student.lowestCourse?.remaining_hours <= 0.5 ? 'bg-red-50' : 'bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          student.lowestCourse?.remaining_hours <= 0.5
                            ? 'bg-red-100 text-red-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          {student.lowestCourse?.course_type_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          student.lowestCourse?.remaining_hours <= 0.5 ? 'text-red-600' : 'text-amber-600'
                        }`}
                      >
                        {student.lowestCourse?.remaining_hours}
                      </p>
                      <p className="text-xs text-gray-500">剩余课时</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions - 桌面端 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#3B82F6]" />
                快捷操作
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={idx}
                      className={`quick-action p-4 ${action.color} rounded-xl text-center cursor-pointer`}
                      onClick={() => navigate(action.path)}
                    >
                      <div className={`w-10 h-10 ${action.iconBg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <Icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                      <p className="text-sm font-medium text-gray-700">{action.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 移动端课时不足提醒 - card-list 风格对齐设计稿 */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              课时不足提醒
            </h2>
            {lowBalanceStudents.length > 0 && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                {lowBalanceStudents.length} 人
              </span>
            )}
          </div>
          <div className="space-y-3">
            {lowBalanceStudents.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">暂无课时不足的学生</p>
              </div>
            ) : (
              lowBalanceStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm touch-feedback"
                  onClick={() => navigate('/students')}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{student.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {student.lowestCourse?.course_type_name}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* 课时统计 - 移动端 */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              课时统计
            </h2>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-lg font-bold text-blue-600">{courseStats.rechargeCount}</p>
                <p className="text-xs text-gray-500 mt-1">充值次数</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-lg font-bold text-orange-600">{courseStats.soldHours}</p>
                <p className="text-xs text-gray-500 mt-1">已售课时</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-lg font-bold text-red-600">{courseStats.usedHours}</p>
                <p className="text-xs text-gray-500 mt-1">已耗课时</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-lg font-bold text-green-600">{courseStats.remainingHours}</p>
                <p className="text-xs text-gray-500 mt-1">剩余课时</p>
              </div>
            </div>
          </div>
        </div>

        {/* 课时统计 - 桌面端 */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              课时统计
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{courseStats.rechargeCount}</p>
                <p className="text-xs text-gray-500 mt-1">充值次数</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{courseStats.soldHours}</p>
                <p className="text-xs text-gray-500 mt-1">已售课时</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{courseStats.usedHours}</p>
                <p className="text-xs text-gray-500 mt-1">已耗课时</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{courseStats.remainingHours}</p>
                <p className="text-xs text-gray-500 mt-1">剩余课时</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">¥{finance.totalIncome.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">总收入</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">¥{finance.totalExpense.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">总支出</p>
              </div>
            </div>
          </div>
        </div>

        {/* 财务概览 - 移动端 */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-600" />
              财务概览
            </h2>
          </div>
          <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-blue-100">本月净利润</p>
              <p className="text-xs text-blue-200">较上月 +15%</p>
            </div>
            <p className="text-2xl font-bold">¥{finance.netProfit.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
              <div>
                <p className="text-xs text-blue-200">收入</p>
                <p className="text-sm font-semibold">¥{finance.totalIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">支出</p>
                <p className="text-sm font-semibold">¥{finance.totalExpense.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
