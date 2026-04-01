import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourseStats, getLowBalance, getTransactionStats } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowBalanceStudents, setLowBalanceStudents] = useState([]);
  const [financialStats, setFinancialStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, lowRes, finRes] = await Promise.all([
          getCourseStats(),
          getLowBalance(),
          getTransactionStats()
        ]);
        setStats(statsRes.data);
        setLowBalanceStudents(lowRes.data);
        setFinancialStats(finRes.data);
      } catch (err) {
        console.error('获取数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">首页概览</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">学生总数</p>
          <p className="text-3xl font-bold">{stats?.total_students || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">教师总数</p>
          <p className="text-3xl font-bold">{stats?.total_teachers || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">剩余总课时</p>
          <p className="text-3xl font-bold">{stats?.total_remaining || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">本月净利润</p>
          <p className="text-3xl font-bold">¥{(financialStats?.netProfit || 0).toFixed(0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 课时不足提醒 */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">⚠️ 课时不足提醒</h2>
            <Link to="/students" className="text-blue-600 hover:text-blue-800 text-sm">查看全部</Link>
          </div>

          {lowBalanceStudents.length > 0 ? (
            <div className="space-y-3">
              {lowBalanceStudents.map((student) => (
                <div key={student.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.teacher_name} · {student.course_type_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{student.remaining_hours}</p>
                    <p className="text-xs text-gray-500">剩余课时</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>🎉 所有学生课时充足</p>
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/courses?tab=recharge"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <span className="text-2xl mb-1">💰</span>
              <span className="text-sm font-medium text-blue-700">课时充值</span>
            </Link>
            <Link
              to="/courses?tab=signin"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
            >
              <span className="text-2xl mb-1">✍️</span>
              <span className="text-sm font-medium text-green-700">上课签到</span>
            </Link>
            <Link
              to="/students"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <span className="text-2xl mb-1">👨‍🎓</span>
              <span className="text-sm font-medium text-purple-700">学生管理</span>
            </Link>
            <Link
              to="/teachers"
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
            >
              <span className="text-2xl mb-1">👨‍🏫</span>
              <span className="text-sm font-medium text-orange-700">教师管理</span>
            </Link>
            <Link
              to="/course-types"
              className="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition"
            >
              <span className="text-2xl mb-1">🎵</span>
              <span className="text-sm font-medium text-pink-700">课程类型</span>
            </Link>
            <Link
              to="/transactions"
              className="flex flex-col items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition"
            >
              <span className="text-2xl mb-1">💳</span>
              <span className="text-sm font-medium text-teal-700">财务管理</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 课时统计详情 */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">课时统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.total_recharges || 0}</p>
            <p className="text-xs text-gray-500">充值次数</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats?.total_hours_sold || 0}</p>
            <p className="text-xs text-gray-500">已售课时</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats?.total_hours_consumed || 0}</p>
            <p className="text-xs text-gray-500">已耗课时</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.total_remaining || 0}</p>
            <p className="text-xs text-gray-500">剩余课时</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">¥{(financialStats?.totalIncome || 0).toFixed(0)}</p>
            <p className="text-xs text-gray-500">总收入</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">¥{(financialStats?.totalExpense || 0).toFixed(0)}</p>
            <p className="text-xs text-gray-500">总支出</p>
          </div>
        </div>
      </div>
    </div>
  );
}