import { useState, useEffect } from 'react';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../api';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', subjects: [], hire_date: '', memo: '' });
  const [error, setError] = useState('');

  const fetchTeachers = async () => {
    try {
      const { data } = await getTeachers();
      setTeachers(data);
    } catch (err) {
      console.error('获取教师列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, formData);
      } else {
        await createTeacher(formData);
      }
      setShowModal(false);
      setEditingTeacher(null);
      setFormData({ name: '', phone: '', subjects: [], hire_date: '', memo: '' });
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    let subjects = [];
    try {
      subjects = teacher.subjects ? JSON.parse(teacher.subjects) : [];
    } catch {
      subjects = [];
    }
    setFormData({
      name: teacher.name,
      phone: teacher.phone || '',
      subjects,
      hire_date: teacher.hire_date || '',
      memo: teacher.memo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该教师吗？')) return;
    try {
      await deleteTeacher(id);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({ name: '', phone: '', subjects: [], hire_date: '', memo: '' });
    setError('');
    setShowModal(true);
  };

  const toggleSubject = (subject) => {
    const newSubjects = formData.subjects.includes(subject)
      ? formData.subjects.filter((s) => s !== subject)
      : [...formData.subjects, subject];
    setFormData({ ...formData, subjects: newSubjects });
  };

  const allSubjects = ['钢琴', '小提琴', '吉他', '古筝', '架子鼓', '声乐', '其他'];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">教师管理</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + 添加教师
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">{teacher.phone || '未填写电话'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {teacher.status === 'active' ? '在职' : '离职'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>教授科目:</span>
                  <span className="font-medium">
                    {teacher.subjects ? (() => {
                      try {
                        return JSON.parse(teacher.subjects).join(', ');
                      } catch {
                        return teacher.subjects;
                      }
                    })() : '未设置'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>入职日期:</span>
                  <span className="font-medium">{teacher.hire_date || '未设置'}</span>
                </div>
                <div className="flex justify-between">
                  <span>学生数量:</span>
                  <span className="font-medium text-blue-600">{teacher.student_count || 0} 人</span>
                </div>
                {teacher.memo && <p className="text-gray-500 text-xs">备注: {teacher.memo}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(teacher)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingTeacher ? '编辑教师' : '添加教师'}</h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">教授科目</label>
                <div className="flex flex-wrap gap-2">
                  {allSubjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        formData.subjects.includes(subject)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入职日期</label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}