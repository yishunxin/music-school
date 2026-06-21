import { useState, useEffect } from 'react';
import { Search, Clock, Plus, User, Check, ClipboardCheck, CreditCard, History, X, AlertTriangle } from 'lucide-react';
import Empty from '../components/common/Empty';
import { students, teachers, courseTypes, courses } from '../api';
import { formatDateTime } from '../utils/format';

export default function Courses() {
  // 设计稿顺序:签到 / 充值 / 记录
  const [activeTab, setActiveTab] = useState('signin');

  return (
    <div className="pb-6">
      {/* 移动端标题区域 - 含返回按钮 */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 pt-6 pb-8">
          <h1 className="text-xl font-bold text-white">课时管理</h1>
          <p className="text-blue-100 mt-1 text-sm">课时充值、签到、记录</p>
        </div>
      </div>

      {/* 桌面端标题 */}
      <div className="hidden md:block px-6 pt-6">
        <h1 className="text-2xl font-bold text-gray-900">课时管理</h1>
        <p className="text-gray-500 mt-1">课时充值、签到、记录查询</p>
      </div>

      {/* Tab Buttons - 移动端 3-Tab 风格对齐设计稿 */}
      <div className="md:hidden px-4 mt-4">
        <div className="flex gap-2 p-1.5 bg-white rounded-xl">
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'signin'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-gray-500 active:bg-gray-50'
            }`}
            onClick={() => setActiveTab('signin')}
          >
            签到
          </button>
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'recharge'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-gray-500 active:bg-gray-50'
            }`}
            onClick={() => setActiveTab('recharge')}
          >
            充值
          </button>
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-gray-500 active:bg-gray-50'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            记录
          </button>
        </div>
      </div>

      {/* Tab Buttons - 桌面端 */}
      <div className="hidden md:block px-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-1.5 inline-flex gap-1">
          <button
            className={`tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            上课签到
          </button>
          <button
            className={`tab-btn ${activeTab === 'recharge' ? 'active' : ''}`}
            onClick={() => setActiveTab('recharge')}
          >
            课时充值
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            记录查询
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-6 mt-4">
        {activeTab === 'signin' && <SignInTab />}
        {activeTab === 'recharge' && <RechargeTab />}
        {activeTab === 'logs' && <LogsTab />}
      </div>
    </div>
  );
}

// 充值 Tab
function RechargeTab() {
  const [studentOptions, setStudentOptions] = useState([]);
  const [teachersList, setTeachers] = useState([]);
  const [courseTypesList, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    student_id: '',
    course_type_id: '',
    teacher_id: '',
    buy_hours: 0,
    gift_hours: 0,
    total_fee: '',
    practice_fee: '',
    recharge_date: new Date().toISOString().split('T')[0],
    remark: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

      const options = studentsRes.data.map(s => ({
        ...s,
        courses_summary: s.courses_summary || [],
      }));
      setStudentOptions(options);
      setTeachers(teachersRes.data.filter((t) => t.status === 1));
      setCourseTypes(courseTypesRes.data.filter((c) => c.status === 1));
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseTypeId) => {
    const course = courseTypesList.find((c) => c.id === Number(courseTypeId));
    if (course) {
      const price = Number(course.price);
      const total = (Number(form.buy_hours || 0) + Number(form.gift_hours || 0)) * price;
      setForm({
        ...form,
        course_type_id: courseTypeId,
        total_fee: total.toFixed(2),
      });
    } else {
      setForm({ ...form, course_type_id: courseTypeId });
    }
  };

  const handleHoursChange = (buyHours, giftHours) => {
    const course = courseTypesList.find((c) => c.id === Number(form.course_type_id));
    if (course) {
      const price = Number(course.price);
      const total = (Number(buyHours || 0) + Number(giftHours || 0)) * price;
      setForm({
        ...form,
        buy_hours: buyHours,
        gift_hours: giftHours,
        total_fee: total.toFixed(2),
      });
    } else {
      setForm({
        ...form,
        buy_hours: buyHours,
        gift_hours: giftHours,
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.teacher_id || !form.course_type_id) {
      alert('请选择学生、教师和课程类型');
      return;
    }
    if (form.buy_hours <= 0) {
      alert('购买课时必须大于0');
      return;
    }

    setSubmitting(true);
    try {
      await courses.recharge(form);
      alert('充值成功');
      setForm({
        student_id: '',
        course_type_id: '',
        teacher_id: '',
        buy_hours: 0,
        gift_hours: 0,
        total_fee: '',
        practice_fee: '',
        recharge_date: new Date().toISOString().split('T')[0],
        remark: '',
      });
    } catch (err) {
      alert('充值失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 移动端卡片式表单 - 对齐设计稿 course-card 风格(20px 圆角) */}
      <div className="bg-white rounded-2xl md:rounded-xl shadow-sm p-5 md:p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">选择学生 *</label>
            <select
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
            >
              <option value="">请选择学生</option>
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">选择课程 *</label>
            <select
              value={form.course_type_id}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
            >
              <option value="">请选择课程</option>
              {courseTypesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - ¥{c.price}/课时
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">授课教师 *</label>
            <select
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
            >
              <option value="">请选择教师</option>
              {teachersList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">购买课时 *</label>
              <input
                type="number"
                min="0"
                value={form.buy_hours}
                onChange={(e) => handleHoursChange(e.target.value, form.gift_hours)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">赠送课时</label>
              <input
                type="number"
                min="0"
                value={form.gift_hours}
                onChange={(e) => handleHoursChange(form.buy_hours, e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">总费用(元)</label>
            <input
              type="number"
              step="0.01"
              value={form.total_fee}
              onChange={(e) => setForm({ ...form, total_fee: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
              placeholder="自动计算"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">充值日期</label>
            <input
              type="date"
              value={form.recharge_date}
              onChange={(e) => setForm({ ...form, recharge_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full bg-[#3B82F6] text-white py-3.5 rounded-xl font-semibold text-base shadow-md disabled:opacity-70 mt-2"
          >
            {submitting ? '充值中...' : '确认充值'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 签到 Tab - 移动端对齐设计稿 course-card 风格
function SignInTab() {
  const [studentOptions, setStudentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await students.list();
      const options = res.data.map(s => ({
        ...s,
        courses_summary: s.courses_summary || [],
      }));
      setStudentOptions(options);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId) => {
    const student = studentOptions.find(s => s.id === Number(studentId));
    setSelectedStudent(student);
    if (student?.courses_summary?.length > 0) {
      const availableCourse = student.courses_summary.find(c => c.remaining_hours > 0);
      if (availableCourse) {
        setSelectedCourse(availableCourse.recharge_id);
      } else {
        setSelectedCourse('');
      }
    } else {
      setSelectedCourse('');
    }
  };

  const handleSignIn = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert('请选择学生和课程');
      return;
    }

    setSubmitting(true);
    try {
      await courses.signIn({
        recharge_id: selectedCourse,
        sign_in_date: new Date().toISOString().split('T')[0],
      });
      alert('签到成功');
      setSelectedStudent(null);
      setSelectedCourse('');
      loadData();
    } catch (err) {
      alert('签到失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  const lowHoursWarning = selectedStudent?.courses_summary?.some(c => c.remaining_hours <= 1);

  return (
    <div className="space-y-4">
      {/* 移动端 course-card - 20px 圆角对齐设计稿 */}
      <div className="bg-white rounded-2xl md:rounded-xl shadow-sm p-5 md:p-6">
        {/* 卡片标题区 - 对齐设计稿 course-card-header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">上课签到</h3>
            <p className="text-xs text-gray-500 mt-0.5">记录学生上课情况</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">选择学生 *</label>
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
            >
              <option value="">请选择学生</option>
              {studentOptions.map((s) => {
                const hasHours = s.courses_summary?.some(c => c.remaining_hours > 0);
                return (
                  <option key={s.id} value={s.id} disabled={!hasHours}>
                    {s.name} {hasHours ? '' : '(无可用课时)'}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedStudent && selectedStudent.courses_summary?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">选择课程 *</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white"
              >
                <option value="">请选择课程</option>
                {selectedStudent.courses_summary
                  .filter(c => c.remaining_hours > 0)
                  .map((c) => (
                    <option key={c.recharge_id} value={c.recharge_id}>
                      {c.course_type_name} - 剩余 {c.remaining_hours} 课时 ({c.teacher_name})
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          {lowHoursWarning && (
            <div className="p-3 bg-[#FEF3C7] rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
              <p className="text-xs text-[#92400E]">该学生有课时不足的课程,请注意提醒续费</p>
            </div>
          )}

          {selectedStudent && (
            <div className="p-4 bg-[#F0F9FF] rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-2">学生课时情况</p>
              <div className="space-y-2">
                {selectedStudent.courses_summary?.map((c, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">{c.course_type_name} <span className="text-gray-400 text-xs">({c.teacher_name})</span></span>
                    <span className={`font-medium ${
                      c.remaining_hours <= 0.5 ? 'text-red-600' :
                      c.remaining_hours <= 1 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {c.remaining_hours} 课时
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={submitting || !selectedStudent || !selectedCourse}
            className="btn-primary w-full bg-[#10B981] text-white py-3.5 rounded-xl font-semibold text-base shadow-md disabled:opacity-70 mt-2"
          >
            {submitting ? '签到中...' : '确认签到'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 记录查询 Tab
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState('all');

  useEffect(() => {
    loadLogs();
  }, [logType]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let res;
      if (logType === 'recharge') {
        res = await courses.getRechargeLogs();
      } else if (logType === 'signin') {
        res = await courses.getSignInLogs();
      } else {
        const [rechargeRes, signInRes] = await Promise.all([
          courses.getRechargeLogs(),
          courses.getSignInLogs(),
        ]);
        setLogs([
          ...(rechargeRes.data || []).map(r => ({ ...r, type: 'recharge' })),
          ...(signInRes.data || []).map(r => ({ ...r, type: 'signin' })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setLoading(false);
        return;
      }
      setLogs(res.data || []);
    } catch (err) {
      console.error('加载记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 筛选标签 */}
      <div className="flex gap-2">
        <button
          onClick={() => setLogType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            logType === 'all' ? 'bg-[#3B82F6] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setLogType('recharge')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            logType === 'recharge' ? 'bg-[#3B82F6] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          充值记录
        </button>
        <button
          onClick={() => setLogType('signin')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            logType === 'signin' ? 'bg-[#3B82F6] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          签到记录
        </button>
      </div>

      {/* 记录列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : logs.length === 0 ? (
        <Empty message="暂无记录" />
      ) : (
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    log.type === 'recharge' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {log.type === 'recharge' ? <Plus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {log.type === 'recharge' ? '课时充值' : '上课签到'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(log.created_at || log.sign_in_date || log.recharge_date)}
                    </p>
                  </div>
                </div>
                {log.type === 'recharge' && (
                  <span className="text-green-600 font-medium">+{log.total_hours} 课时</span>
                )}
                {log.type === 'signin' && (
                  <span className="text-orange-600 font-medium">-1 课时</span>
                )}
              </div>
              <div className="text-sm text-gray-600 pl-10">
                <p>{log.student_name}</p>
                {log.course_type_name && <p>{log.course_type_name}</p>}
                {log.teacher_name && <p>教师:{log.teacher_name}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
