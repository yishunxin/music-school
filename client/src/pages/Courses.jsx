import { useState, useEffect } from 'react';
import { getStudents, getTeachers, getCourseTypes, recharge, getRecharges, signIn, getCourseLogs, deleteCourseLog, getCourseStats } from '../api';

export default function Courses() {
  const [activeTab, setActiveTab] = useState('stats');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 充值表单
  const [rechargeForm, setRechargeForm] = useState({
    student_id: '', course_type_id: '', teacher_id: '',
    buy_hours: '', gift_hours: '', total_fee: '', practice_fee: '', recharge_date: new Date().toISOString().split('T')[0], memo: ''
  });
  const [rechargeList, setRechargeList] = useState([]);
  const [rechargeError, setRechargeError] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState('');

  // 签到表单
  const [signInForm, setSignInForm] = useState({
    student_id: '', hours: 1, course_date: new Date().toISOString().slice(0, 16), memo: ''
  });
  const [courseLogs, setCourseLogs] = useState([]);
  const [signInError, setSignInError] = useState('');
  const [signInSuccess, setSignInSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchData = async () => {
    try {
      const [studentsRes, teachersRes, courseTypesRes, statsRes] = await Promise.all([
        getStudents({ status: 'active' }),
        getTeachers({ status: 'active' }),
        getCourseTypes({ status: 'active' }),
        getCourseStats()
      ]);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setCourseTypes(courseTypesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 加载充值记录和上课记录
  const loadRecords = async () => {
    try {
      const [rechargesRes, logsRes] = await Promise.all([
        getRecharges(),
        getCourseLogs()
      ]);
      setRechargeList(rechargesRes.data);
      setCourseLogs(logsRes.data);
    } catch (err) {
      console.error('获取记录失败:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'recharge') loadRecords();
    if (activeTab === 'signin') loadRecords();
  }, [activeTab]);

  // 处理学生选择变化
  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    setSelectedStudent(student || null);

    if (student) {
      // 自动关联老师和课程类型
      setSignInForm(prev => ({
        ...prev,
        student_id: studentId,
        course_type_id: student.course_type_id,
        teacher_id: student.teacher_id
      }));
    } else {
      setSignInForm(prev => ({
        ...prev,
        student_id: studentId,
        course_type_id: '',
        teacher_id: ''
      }));
    }
  };

  // 课时充值
  const handleRecharge = async (e) => {
    e.preventDefault();
    setRechargeError('');
    setRechargeSuccess('');

    try {
      await recharge(rechargeForm);
      setRechargeSuccess('充值成功！');
      setRechargeForm({
        student_id: '', course_type_id: '', teacher_id: '',
        buy_hours: '', gift_hours: '', total_fee: '', practice_fee: '', recharge_date: new Date().toISOString().split('T')[0], memo: ''
      });
      fetchData();
      loadRecords();
    } catch (err) {
      setRechargeError(err.response?.data?.error || '充值失败');
    }
  };

  // 上课签到
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');
    setSignInSuccess('');

    try {
      const result = await signIn(signInForm);
      setSignInSuccess(`签到成功！剩余课时: ${result.data.remaining_hours}`);
      setSignInForm({
        student_id: '', hours: 1, course_date: new Date().toISOString().slice(0, 16), memo: ''
      });
      setSelectedStudent(null);
      fetchData();
      loadRecords();
    } catch (err) {
      setSignInError(err.response?.data?.error || '签到失败');
    }
  };

  // 退课
  const handleRefund = async (logId) => {
    if (!confirm('确定要退课吗？课时将退还给学生。')) return;
    try {
      await deleteCourseLog(logId);
      fetchData();
      loadRecords();
    } catch (err) {
      alert(err.response?.data?.error || '退课失败');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">课时管理</h1>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        {['stats', 'recharge', 'signin', 'records'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'stats' ? '课时统计' : tab === 'recharge' ? '课时充值' : tab === 'signin' ? '上课签到' : '记录查询'}
          </button>
        ))}
      </div>

      {/* 课时统计 */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">学生总数</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total_students}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">教师总数</p>
            <p className="text-2xl font-bold text-green-600">{stats.total_teachers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">充值次数</p>
            <p className="text-2xl font-bold text-purple-600">{stats.total_recharges}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">已售课时</p>
            <p className="text-2xl font-bold text-orange-600">{stats.total_hours_sold}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">已消耗课时</p>
            <p className="text-2xl font-bold text-red-600">{stats.total_hours_consumed}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">剩余总课时</p>
            <p className="text-2xl font-bold text-teal-600">{stats.total_remaining}</p>
          </div>
        </div>
      )}

      {/* 课时充值 */}
      {activeTab === 'recharge' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">新建充值</h2>

            {rechargeError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{rechargeError}</div>}
            {rechargeSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">{rechargeSuccess}</div>}

            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学生 *</label>
                <select
                  value={rechargeForm.student_id}
                  onChange={(e) => {
                    setRechargeForm({ ...rechargeForm, student_id: e.target.value });
                    const student = students.find(s => s.id === parseInt(e.target.value));
                    if (student) {
                      setRechargeForm(prev => ({
                        ...prev,
                        student_id: e.target.value,
                        course_type_id: student.course_type_id,
                        teacher_id: student.teacher_id
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">请选择学生</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (剩余{s.remaining_hours}课时)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程类型</label>
                  <select
                    value={rechargeForm.course_type_id}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, course_type_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">请选择</option>
                    {courseTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">授课老师</label>
                  <select
                    value={rechargeForm.teacher_id}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">请选择</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">购买课时 *</label>
                  <input
                    type="number"
                    value={rechargeForm.buy_hours}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, buy_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">赠送课时</label>
                  <input
                    type="number"
                    value={rechargeForm.gift_hours}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, gift_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程费(元) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rechargeForm.total_fee}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, total_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">练琴费(元)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rechargeForm.practice_fee}
                    onChange={(e) => setRechargeForm({ ...rechargeForm, practice_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="无练琴费可填0或留空"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">充值日期</label>
                <input
                  type="date"
                  value={rechargeForm.recharge_date}
                  onChange={(e) => setRechargeForm({ ...rechargeForm, recharge_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={rechargeForm.memo}
                  onChange={(e) => setRechargeForm({ ...rechargeForm, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                确认充值
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">充值记录</h2>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">学生</th>
                    <th className="px-3 py-2 text-left">课时</th>
                    <th className="px-3 py-2 text-left">课程费</th>
                    <th className="px-3 py-2 text-left">练琴费</th>
                    <th className="px-3 py-2 text-left">日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rechargeList.slice(0, 20).map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2">{r.student_name}</td>
                      <td className="px-3 py-2">+{r.total_hours}</td>
                      <td className="px-3 py-2 text-green-600">¥{r.total_fee}</td>
                      <td className="px-3 py-2 text-blue-600">{r.practice_fee > 0 ? '¥' + r.practice_fee : '-'}</td>
                      <td className="px-3 py-2">{r.recharge_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 上课签到 */}
      {activeTab === 'signin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">上课签到</h2>

            {signInError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{signInError}</div>}
            {signInSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">{signInSuccess}</div>}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学生 *</label>
                <select
                  value={signInForm.student_id}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">请选择学生</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (剩余{s.remaining_hours}课时)
                      {s.remaining_hours <= 1 && <span className="text-red-500"> ⚠️</span>}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <p>授课老师: {teachers.find(t => t.id === selectedStudent.teacher_id)?.name || '-'}</p>
                  <p>课程类型: {courseTypes.find(ct => ct.id === selectedStudent.course_type_id)?.name || '-'}</p>
                  <p className="font-medium">剩余课时: <span className={selectedStudent.remaining_hours <= 1 ? 'text-red-600' : 'text-green-600'}>{selectedStudent.remaining_hours}</span></p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">消耗课时</label>
                  <input
                    type="number"
                    step="0.5"
                    value={signInForm.hours}
                    onChange={(e) => setSignInForm({ ...signInForm, hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上课时间</label>
                  <input
                    type="datetime-local"
                    value={signInForm.course_date}
                    onChange={(e) => setSignInForm({ ...signInForm, course_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={signInForm.memo}
                  onChange={(e) => setSignInForm({ ...signInForm, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                确认签到
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">上课记录</h2>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">学生</th>
                    <th className="px-3 py-2 text-left">课时</th>
                    <th className="px-3 py-2 text-left">教师</th>
                    <th className="px-3 py-2 text-left">时间</th>
                    <th className="px-3 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courseLogs.slice(0, 20).map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-2">{log.student_name}</td>
                      <td className="px-3 py-2">-{log.hours}</td>
                      <td className="px-3 py-2">{log.teacher_name}</td>
                      <td className="px-3 py-2">{new Date(log.course_date).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleRefund(log.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          退课
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 记录查询 */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">全部记录</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-500">充值记录和上课记录</p>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">充值记录</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">学生</th>
                  <th className="px-3 py-2 text-left">课程类型</th>
                  <th className="px-3 py-2 text-left">购买课时</th>
                  <th className="px-3 py-2 text-left">赠送课时</th>
                  <th className="px-3 py-2 text-left">课程费</th>
                  <th className="px-3 py-2 text-left">练琴费</th>
                  <th className="px-3 py-2 text-left">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rechargeList.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{r.student_name}</td>
                    <td className="px-3 py-2">{r.course_type_name}</td>
                    <td className="px-3 py-2">{r.buy_hours}</td>
                    <td className="px-3 py-2">{r.gift_hours}</td>
                    <td className="px-3 py-2 text-green-600">¥{r.total_fee}</td>
                    <td className="px-3 py-2 text-blue-600">{r.practice_fee > 0 ? '¥' + r.practice_fee : '-'}</td>
                    <td className="px-3 py-2">{r.recharge_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">上课记录</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">学生</th>
                  <th className="px-3 py-2 text-left">教师</th>
                  <th className="px-3 py-2 text-left">课程类型</th>
                  <th className="px-3 py-2 text-left">消耗课时</th>
                  <th className="px-3 py-2 text-left">教师费用</th>
                  <th className="px-3 py-2 text-left">上课时间</th>
                  <th className="px-3 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courseLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2">{log.id}</td>
                    <td className="px-3 py-2">{log.student_name}</td>
                    <td className="px-3 py-2">{log.teacher_name}</td>
                    <td className="px-3 py-2">{log.course_type_name}</td>
                    <td className="px-3 py-2">-{log.hours}</td>
                    <td className="px-3 py-2 text-red-600">¥{log.total_fee}</td>
                    <td className="px-3 py-2">{new Date(log.course_date).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleRefund(log.id)} className="text-red-600 hover:text-red-800">退课</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}