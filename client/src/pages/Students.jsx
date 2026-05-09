import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, User, Clock, AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { students } from '../api';

export default function Students() {
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await students.list();
      setStudentList(res.data);
    } catch (err) {
      console.error('加载学生列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
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
    s.name?.includes(search) || s.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">学生管理</h1>
          <p className="text-gray-500 mt-1">管理学员信息和课时</p>
        </div>
        <Button onClick={() => { setEditData(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          添加学生
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索学生姓名或电话..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </Card>

      {/* Student List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredStudents.length === 0 ? (
        <Empty message="暂无学生数据" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-blue-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 truncate">{student.name}</h3>
                    {student.courses_summary?.some(c => c.remaining_hours <= 1) && (
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" title="有课程课时不足" />
                    )}
                  </div>

                  {/* Contact */}
                  <div className="mt-2 space-y-1">
                    {student.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        {student.phone}
                      </p>
                    )}
                    {student.courses_summary && student.courses_summary.length > 0 ? (
                      student.courses_summary.map((course, idx) => (
                        <p key={idx} className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          {course.course_type_name}：
                          <span className={`font-medium ${
                            course.remaining_hours <= 1 ? 'text-warning' : 'text-success'
                          }`}>
                            {course.remaining_hours}课时
                          </span>
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        暂无充值记录
                      </p>
                    )}
                  </div>

                  {/* Course Info */}
                  {student.courses_summary && student.courses_summary.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {student.courses_summary.slice(0, 2).map((course, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                          {course.course_type_name}
                        </span>
                      ))}
                      {student.courses_summary.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                          +{student.courses_summary.length - 2}
                        </span>
                      )}
                      {student.courses_summary[0]?.teacher_name && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {student.courses_summary[0].teacher_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditData(student); setModalOpen(true); }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(student.id)}
                  className="text-error hover:bg-error/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
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
        />
      </Modal>
    </div>
  );
}

function StudentForm({ data, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    phone: data?.phone || '',
    parent_name: data?.parent_name || '',
    parent_phone: data?.parent_phone || '',
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
          <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="请输入学生姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="学生联系方式"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">家长姓名</label>
          <input
            type="text"
            value={form.parent_name}
            onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="请输入家长姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">家长电话</label>
          <input
            type="tel"
            value={form.parent_phone}
            onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="请输入家长电话"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          value={form.remark}
          onChange={(e) => setForm({ ...form, remark: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="备注信息（可选）"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          保存
        </Button>
      </div>
    </form>
  );
}
