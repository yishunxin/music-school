import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, User, Clock, AlertCircle, X } from 'lucide-react';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { students } from '../api';

export default function Students() {
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const pageSize = 10;

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await students.list();
      setStudentList(res.data || []);
    } catch (err) {
      console.error('加载学生列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editData) {
        await students.update(editData.id, data);
      } else {
        await students.create(data);
      }
      setModalOpen(false);
      setEditData(null);
      loadStudents();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该学生吗？')) return;
    try {
      await students.delete(id);
      loadStudents();
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredStudents = studentList.filter((s) =>
    s.name?.includes(search) || s.phone?.includes(search) || s.parent_name?.includes(search)
  );

  const subjectFiltered = filteredStudents.filter((s) => {
    if (subjectFilter === 'all') return true;
    return s.courses_summary?.some((c) => c.subject === subjectFilter);
  });
  const totalPages = Math.ceil(subjectFiltered.length / pageSize);
  const paginatedStudents = subjectFiltered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const subjectFilters = [
    { key: 'all', label: '全部' },
    { key: '钢琴', label: '钢琴' },
    { key: '小提琴', label: '小提琴' },
    { key: '吉他', label: '吉他' },
    { key: '声乐', label: '声乐' },
  ];

  // 获取头像颜色
  const getAvatarColor = (name) => {
    const colors = [
      'from-pink-400 to-pink-500',
      'from-purple-400 to-purple-500',
      'from-blue-400 to-blue-500',
      'from-green-400 to-green-500',
      'from-orange-400 to-orange-500',
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  // 获取剩余课时样式
  const getHoursStyle = (hours) => {
    if (hours <= 0.5) return 'bg-red-100 text-red-700';
    if (hours <= 1) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  // 获取主要课程信息
  const getMainCourse = (student) => {
    if (student.courses_summary && student.courses_summary.length > 0) {
      return student.courses_summary[0];
    }
    return null;
  };

  return (
    <div className="pb-6">
      {/* 移动端标题区域 */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 pt-6 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">学生管理</h1>
              <p className="text-blue-100 mt-1 text-sm">共 {studentList.length} 名学生</p>
            </div>
            <button 
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
              onClick={() => { setEditData(null); setModalOpen(true); }}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* 搜索框 */}
        <div className="px-4 -mt-4">
          <div className="bg-white rounded-xl shadow-lg p-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="搜索学生姓名 / 电话..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端标题区域 */}
      <div className="hidden md:flex md:items-center md:justify-between md:px-6 md:pt-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-gray-500 mt-1">共 {studentList.length} 名学生</p>
        </div>
        <button 
          className="btn-primary bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2"
          onClick={() => { setEditData(null); setModalOpen(true); }}
        >
          <Plus className="w-5 h-5" />
          添加学生
        </button>
      </div>

      {/* 桌面端搜索 */}
      <div className="hidden md:block md:px-6 md:mt-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="搜索学生姓名 / 电话 / 监护人..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* 移动端学生列表 */}
      <div className="md:hidden px-4 mt-4">
        {/* 横向滚动 filter-tabs - 全部/钢琴/小提琴/吉他/声乐 */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
          {subjectFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setSubjectFilter(f.key); setCurrentPage(1); }}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium border-[1.5px] transition-colors whitespace-nowrap ${
                subjectFilter === f.key
                  ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                  : 'bg-white text-gray-500 border-gray-200 active:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : subjectFiltered.length === 0 ? (
          <div className="py-12">
            <Empty message="暂无学生数据" />
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedStudents.map((student) => {
              const mainCourse = getMainCourse(student);
              return (
                <div
                  key={student.id}
                  className="bg-white rounded-xl p-4 shadow-sm active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-500">
                          {student.gender === 1 ? '男' : student.gender === 2 ? '女' : ''} {student.age ? `· ${student.age}岁` : ''}
                        </p>
                      </div>
                    </div>
                    {mainCourse && (
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          Number(mainCourse.remaining_hours) <= 0
                            ? 'text-[#EF4444]'
                            : Number(mainCourse.remaining_hours) <= 1
                              ? 'text-[#F59E0B]'
                              : 'text-gray-900'
                        }`}>{Math.floor(Number(mainCourse.remaining_hours) || 0)}</div>
                        <div className="text-[10px] text-gray-500">课时</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px] mb-3">
                    {mainCourse ? (
                      <>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">{mainCourse.course_type_name || mainCourse.subject}</span>
                        {Number(mainCourse.remaining_hours) <= 0 && (
                          <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] font-medium">剩余0课时</span>
                        )}
                        {Number(mainCourse.remaining_hours) > 0 && Number(mainCourse.remaining_hours) <= 1 && (
                          <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] font-medium">剩余{Math.floor(Number(mainCourse.remaining_hours))}课时</span>
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500">暂无课程</span>
                    )}
                    {student.phone && (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">{student.phone}</span>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-base"
                      onClick={() => { setEditData(student); setModalOpen(true); }}
                    >
                      编辑
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-red-50 transition-base"
                      onClick={() => handleDelete(student.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 桌面端学生表格 */}
      {loading ? (
        <div className="hidden md:block text-center py-12 text-gray-500">加载中...</div>
      ) : subjectFiltered.length === 0 ? (
        <div className="hidden md:block px-6">
          <Empty message="暂无学生数据" />
        </div>
      ) : (
        <div className="hidden md:block px-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">学生</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">性别</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">年龄</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">课程</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">剩余课时</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.map((student) => {
                  const mainCourse = getMainCourse(student);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-base cursor-pointer">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(student.name)} flex items-center justify-center text-white font-medium`}>
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.phone || '暂无电话'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.gender === 1 ? '男' : student.gender === 2 ? '女' : '-'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.age || '-'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {mainCourse 
                          ? `${mainCourse.course_type_name} / ${mainCourse.teacher_name || '暂无教师'}`
                          : '暂无课程'}
                      </td>
                      <td className="px-5 py-4">
                        {mainCourse ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getHoursStyle(Number(mainCourse.remaining_hours))}`}>
                            {Math.floor(Number(mainCourse.remaining_hours))} 课时
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            无课时
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button 
                          className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium mr-4"
                          onClick={() => { setEditData(student); setModalOpen(true); }}
                        >
                          编辑
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                          onClick={() => handleDelete(student.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, subjectFiltered.length)} 条，共 {subjectFiltered.length} 条
              </p>
              <div className="flex items-center gap-2">
                <button 
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      page = currentPage - 2 + i;
                      if (page > totalPages) return null;
                    }
                  }
                  return (
                    <button
                      key={page}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        currentPage === page 
                          ? 'bg-[#3B82F6] text-white' 
                          : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button 
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        title={editData ? '编辑学生' : '添加学生'}
        size="lg"
      >
        <StudentForm
          data={editData}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditData(null); }}
          saving={saving}
        />
      </Modal>
    </div>
  );
}

function StudentForm({ data, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    phone: data?.phone || '',
    parent_name: data?.parent_name || '',
    parent_phone: data?.parent_phone || '',
    gender: data?.gender || 0,
    age: data?.age || '',
    remark: data?.remark || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      alert('请输入学生姓名');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
            placeholder="请输入学生姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">电话</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
            placeholder="学生联系方式"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">性别</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
          >
            <option value={0}>请选择</option>
            <option value={1}>男</option>
            <option value={2}>女</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">年龄</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
            placeholder="学生年龄"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">家长姓名</label>
          <input
            type="text"
            value={form.parent_name}
            onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
            placeholder="请输入家长姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">家长电话</label>
          <input
            type="tel"
            value={form.parent_phone}
            onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
            placeholder="请输入家长电话"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
        <textarea
          value={form.remark}
          onChange={(e) => setForm({ ...form, remark: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="备注信息（可选）"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-base"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl font-medium shadow-md disabled:opacity-70"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
