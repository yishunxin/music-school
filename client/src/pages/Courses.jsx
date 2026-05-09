import { useState, useEffect } from 'react';
import { Search, Clock, Plus, User, CheckCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Empty from '../components/common/Empty';
import { students, teachers, courseTypes, courses } from '../api';
import { formatDateTime } from '../utils/format';

export default function Courses() {
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">课时管理</h1>
        <p className="text-gray-500 mt-1">签到上课、课时充值、记录查询</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
        {[
          { key: 'signin', label: '签到', icon: CheckCircle },
          { key: 'recharge', label: '充值', icon: Plus },
          { key: 'records', label: '记录', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'signin' && <SignInTab />}
      {activeTab === 'recharge' && <RechargeTab />}
      {activeTab === 'records' && <RecordsTab />}
    </div>
  );
}

// 签到 Tab
function SignInTab() {
  const [studentOptions, setStudentOptions] = useState([]); // 学生+课程选项
  const [teachers, setTeachers] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    student_id: '',
    course_type_id: '', // 现在直接传课程类型ID
    teacher_id: '',
    hours: 1,
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

      // 构建学生+课程选项：有剩余课时的学生和课程
      const options = [];
      studentsRes.data.forEach(student => {
        if (student.courses_summary && student.courses_summary.length > 0) {
          student.courses_summary.forEach(course => {
            options.push({
              student_id: student.id,
              student_name: student.name,
              course_type_id: course.course_type_id,
              course_type_name: course.course_type_name,
              teacher_id: course.teacher_id,
              teacher_name: course.teacher_name,
              remaining_hours: course.remaining_hours,
            });
          });
        }
      });
      setStudentOptions(options);

      setTeachers(teachersRes.data.filter((t) => t.status === 1));
      setCourseTypes(courseTypesRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.course_type_id || !form.teacher_id) {
      alert('请选择学生、课程和教师');
      return;
    }

    setSubmitting(true);
    try {
      await courses.signIn(form);
      alert('签到成功');
      setForm({ student_id: '', course_type_id: '', teacher_id: '', hours: 1 });
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

  return (
    <Card title="上课签到">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择学生和课程 *</label>
          <select
            value={`${form.student_id}-${form.course_type_id}`}
            onChange={(e) => {
              const [student_id, course_type_id] = e.target.value.split('-');
              const option = studentOptions.find(o => o.student_id === Number(student_id) && o.course_type_id === Number(course_type_id));
              setForm({
                ...form,
                student_id,
                course_type_id,
                teacher_id: option?.teacher_id?.toString() || '',
              });
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">请选择学生和课程</option>
            {studentOptions.map((opt, idx) => (
              <option key={idx} value={`${opt.student_id}-${opt.course_type_id}`}>
                {opt.student_name} - {opt.course_type_name} (剩余{opt.remaining_hours}课时)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择教师 *</label>
          <select
            value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">请选择教师</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">消耗课时</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="10"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!form.student_id || !form.course_type_id || !form.teacher_id}
        >
          <CheckCircle className="w-4 h-4" />
          确认签到
        </Button>
      </div>
    </Card>
  );
}

// 充值 Tab
function RechargeTab() {
  const [studentOptions, setStudentOptions] = useState([]); // 学生+课程选项
  const [teachers, setTeachers] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    student_id: '',
    course_type_id: '',
    teacher_id: '',
    buy_hours: 10,
    gift_hours: 0,
    total_fee: '',
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

      // 构建学生选项（包含课程信息）
      const options = studentsRes.data.map(s => ({
        ...s,
        courses_summary: s.courses_summary || [],
      }));
      setStudentOptions(options);

      setTeachers(teachersRes.data.filter((t) => t.status === 1));
      setCourseTypes(courseTypesRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = studentOptions.find(s => s.id === Number(form.student_id));

  const handleCourseChange = (courseTypeId) => {
    const course = courseTypes.find((c) => c.id === Number(courseTypeId));
    if (course) {
      const price = Number(course.price);
      const total = (form.buy_hours + form.gift_hours) * price;
      setForm({
        ...form,
        course_type_id: courseTypeId,
        total_fee: total.toFixed(2),
      });
    }
  };

  const handleHoursChange = (buyHours, giftHours) => {
    const course = courseTypes.find((c) => c.id === Number(form.course_type_id));
    if (course) {
      const price = Number(course.price);
      const total = (Number(buyHours) + Number(giftHours)) * price;
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
        buy_hours: 10,
        gift_hours: 0,
        total_fee: '',
      });
      loadData();
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
    <Card title="课时充值">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择学生 *</label>
          <select
            value={form.student_id}
            onChange={(e) => setForm({
              ...form,
              student_id: e.target.value,
              course_type_id: '',
            })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">请选择学生</option>
            {studentOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.courses_summary?.length > 0 && ` (已有${s.courses_summary.length}门课程)`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择教师 *</label>
          <select
            value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">请选择教师</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择课程 *</label>
          <select
            value={form.course_type_id}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">请选择课程</option>
            {courseTypes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.level}级 (¥{c.price}/课时)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">购买课时</label>
            <input
              type="number"
              min="1"
              value={form.buy_hours}
              onChange={(e) => handleHoursChange(e.target.value, form.gift_hours)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">赠送课时</label>
            <input
              type="number"
              min="0"
              value={form.gift_hours}
              onChange={(e) => handleHoursChange(form.buy_hours, e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">应付金额</span>
            <span className="text-2xl font-bold text-primary">
              ¥{form.total_fee || '0.00'}
            </span>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!form.student_id || !form.teacher_id || !form.course_type_id}
        >
          <Plus className="w-4 h-4" />
          确认充值
        </Button>
      </div>
    </Card>
  );
}

// 记录 Tab
function RecordsTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const params = {};
      if (filters.student_id) params.student_id = filters.student_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const res = await courses.records(params);
      setRecords(res.data);
    } catch (err) {
      console.error('加载记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadRecords();
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <Button type="submit">
            <Search className="w-4 h-4" />
            查询
          </Button>
        </form>
      </Card>

      {records.length === 0 ? (
        <Empty message="暂无上课记录" />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    record.type === 'sign_in' ? 'bg-success/10' : 'bg-primary/10'
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      record.type === 'sign_in' ? 'text-success' : 'text-primary'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{record.student_name}</p>
                    <p className="text-sm text-gray-500">
                      {record.course_name} - {record.teacher_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    record.type === 'sign_in' ? 'text-error' : 'text-success'
                  }`}>
                    {record.type === 'sign_in' ? '-' : '+'}{record.hours}课时
                  </p>
                  <p className="text-xs text-gray-500">{formatDateTime(record.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
