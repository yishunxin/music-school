import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Mail, Users } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { teachers } from '../api';

export default function Teachers() {
  const [teacherList, setTeacherList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await teachers.list();
      setTeacherList(res.data);
    } catch (err) {
      console.error('加载教师列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editData) {
        await teachers.update(editData.id, data);
      } else {
        await teachers.create(data);
      }
      setModalOpen(false);
      setEditData(null);
      loadTeachers();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该教师吗？')) return;
    try {
      await teachers.delete(id);
      loadTeachers();
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredTeachers = teacherList.filter((t) =>
    t.name?.includes(search) || t.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">教师管理</h1>
          <p className="text-gray-500 mt-1">管理授课教师信息</p>
        </div>
        <Button onClick={() => { setEditData(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          添加教师
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索教师姓名或电话..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </Card>

      {/* Teacher List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredTeachers.length === 0 ? (
        <Empty message="暂无教师数据" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-lg">
                    {teacher.name?.charAt(0) || 'T'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 truncate">{teacher.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      teacher.status === 1 ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {teacher.status === 1 ? '在职' : '离职'}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="mt-2 space-y-1">
                    {teacher.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        {teacher.phone}
                      </p>
                    )}
                    {teacher.email && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        {teacher.email}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      关联学生：{teacher.student_count || 0}
                    </p>
                  </div>

                  {/* Subjects */}
                  {teacher.subjects && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {teacher.subjects.split(',').map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditData(teacher); setModalOpen(true); }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(teacher.id)}
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
        title={editData ? '编辑教师' : '添加教师'}
      >
        <TeacherForm
          data={editData}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditData(null); }}
        />
      </Modal>
    </div>
  );
}

function TeacherForm({ data, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    phone: data?.phone || '',
    email: data?.email || '',
    subjects: data?.subjects || '',
    status: data?.status ?? 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      alert('请输入教师姓名');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="请输入教师姓名"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="请输入联系电话"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="请输入邮箱"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">教授科目</label>
        <input
          type="text"
          value={form.subjects}
          onChange={(e) => setForm({ ...form, subjects: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="多个科目用逗号分隔，如：吉他,尤克里里"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value={1}>在职</option>
          <option value={0}>离职</option>
        </select>
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
