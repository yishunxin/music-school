import { useState, useEffect } from 'react';
import { getStudents, getTeachers, getCourseTypes, createStudent, updateStudent, deleteStudent } from '../api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '', gender: '', age: '', phone: '',
    guardian_name: '', guardian_phone: '',
    teacher_id: '', course_type_id: '', memo: ''
  });
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, studentId: null, studentName: '', password: '' });
  const [deleteError, setDeleteError] = useState('');

  const fetchData = async () => {
    try {
      const [studentsRes, teachersRes, courseTypesRes] = await Promise.all([
        getStudents({ search }),
        getTeachers({ status: 'active' }),
        getCourseTypes({ status: 'active' })
      ]);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setCourseTypes(courseTypesRes.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.teacher_id || !formData.course_type_id) {
      setError('授课老师和课程类型为必填项');
      return;
    }

    try {
      const submitData = { ...formData, age: formData.age ? parseInt(formData.age) : undefined };
      if (editingStudent) {
        await updateStudent(editingStudent.id, submitData);
      } else {
        await createStudent(submitData);
      }
      setShowModal(false);
      setEditingStudent(null);
      resetFormData();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '', gender: '', age: '', phone: '',
      guardian_name: '', guardian_phone: '',
      teacher_id: '', course_type_id: '', memo: ''
    });
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      gender: student.gender || '',
      age: student.age || '',
      phone: student.phone || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      teacher_id: student.teacher_id || '',
      course_type_id: student.course_type_id || '',
      memo: student.memo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const student = students.find(s => s.id === id);
    setDeleteModal({ show: true, studentId: id, studentName: student?.name || '', password: '' });
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteModal.password) {
      setDeleteError('请输入登录密码');
      return;
    }
    try {
      await deleteStudent(deleteModal.studentId, deleteModal.password);
      setDeleteModal({ show: false, studentId: null, studentName: '', password: '' });
      fetchData();
    } catch (err) {
      setDeleteError(err.response?.data?.error || '删除失败');
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    resetFormData();
    setError('');
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">学生管理</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + 添加学生
        </button>
      </div>

      {/* 搜索框 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索学生姓名/电话/监护人..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">性别</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">年龄</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">授课老师</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">剩余课时</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.gender || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.age || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.course_type_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.teacher_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${student.remaining_hours <= 1 ? 'text-red-600' : 'text-green-600'}`}>
                      {student.remaining_hours}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-32 truncate">{student.memo || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => handleEdit(student)} className="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="text-center py-10 text-gray-500">暂无数据</div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingStudent ? '编辑学生' : '添加学生'}</h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">监护人姓名</label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">监护人电话</label>
                  <input
                    type="tel"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">授课老师 *</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">请选择</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程类型 *</label>
                  <select
                    value={formData.course_type_id}
                    onChange={(e) => setFormData({ ...formData, course_type_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">请选择</option>
                    {courseTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>
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

      {/* 删除确认弹窗 */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-red-600">删除学生</h2>
            <p className="text-gray-600 mb-4">
              确定要删除学生 <span className="font-bold">{deleteModal.studentName}</span> 吗？<br/>
              此操作不可恢复。
            </p>

            {deleteError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {deleteError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">请输入登录密码确认</label>
              <input
                type="password"
                value={deleteModal.password}
                onChange={(e) => setDeleteModal({ ...deleteModal, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="输入密码"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, studentId: null, studentName: '', password: '' })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}