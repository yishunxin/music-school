import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Music, Wallet, AlertCircle, Clock } from 'lucide-react';
import Card from '../components/common/Card';
import { students, teachers, courseTypes } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    todayHours: 0,
  });
  const [lowBalanceStudents, setLowBalanceStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

      setStats({
        students: studentsRes.data.length,
        teachers: teachersRes.data.length,
        courses: courseTypesRes.data.length,
        todayHours: 0,
      });

      // 获取课时不足的学生
      const allStudents = studentsRes.data;
      // 找出有任意课程剩余课时 <= 1 的学生
      const lowBalance = allStudents.filter((s) =>
        s.courses_summary?.some(c => c.remaining_hours <= 1)
      ).map(s => ({
        ...s,
        displayHours: s.courses_summary?.map(c => `${c.course_type_name}: ${c.remaining_hours}课时`).join(', ') || '未知'
      }));
      setLowBalanceStudents(lowBalance);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '学生总数', value: stats.students, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '教师总数', value: stats.teachers, icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: '课程类型', value: stats.courses, icon: Music, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: '今日课时', value: stats.todayHours, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">首页概览</h1>
        <p className="text-gray-500 mt-1">欢迎使用琴行管理系统</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="!p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{loading ? '-' : item.value}</p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Low Balance Warning */}
      {lowBalanceStudents.length > 0 && (
        <Card title="课时不足提醒" className="!border-l-4 !border-l-warning">
          <div className="space-y-3">
            {lowBalanceStudents.map((student) => (
              <div className="flex items-center gap-3 p-3 bg-warning/5 rounded-lg"
                key={student.id}
              >
                <AlertCircle className="w-5 h-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{student.name}</p>
                  <p className="text-sm text-gray-500">
                    {student.displayHours}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card title="快捷操作">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction icon={Users} label="添加学生" color="bg-blue-500" onClick={() => navigate('/students')} />
          <QuickAction icon={GraduationCap} label="添加教师" color="bg-emerald-500" onClick={() => navigate('/teachers')} />
          <QuickAction icon={Music} label="课时充值" color="bg-purple-500" onClick={() => navigate('/courses')} />
          <QuickAction icon={Wallet} label="财务记录" color="bg-amber-500" onClick={() => navigate('/transactions')} />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
    >
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}
