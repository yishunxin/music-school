import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Music, Calendar, Users, X, Check } from 'lucide-react';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { teachers } from '../api';
import { courseTypes } from '../api';

export default function Teachers() {
  const [teacherList, setTeacherList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await teachers.list();
      setTeacherList(res.data || []);
    } catch (err) {
      console.error('加载教师列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
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
    } finally {
      setSaving(false);
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

  // 随机颜色生成
  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <div className="pb-6">
      {/* 移动端标题区域 */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 pt-6 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">教师管理</h1>
              <p className="text-blue-100 mt-1 text-sm">共 {teacherList.length} 位教师</p>
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
                placeholder="搜索教师姓名 / 电话..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端标题区域 */}
      <div className="hidden md:flex md:items-center md:justify-between md:px-6 md:pt-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教师管理</h1>
          <p className="text-gray-500 mt-1">共 {teacherList.length} 位教师</p>
        </div>
        <button 
          className="btn-primary bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2"
          onClick={() => { setEditData(null); setModalOpen(true); }}
        >
          <Plus className="w-5 h-5" />
          添加教师
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
              placeholder="搜索教师姓名 / 电话..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* 移动端列表 */}
      <div className="md:hidden px-4 mt-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-12">
            <Empty message="暂无教师数据" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeachers.map((teacher) => (
              <div 
                key={teacher.id}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(teacher.name)} flex items-center justify-center text-white font-semibold text-lg`}>
                      {teacher.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{teacher.name}</h3>
                      <p className="text-sm text-gray-500">{teacher.phone || '暂无电话'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    teacher.status === 1 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {teacher.status === 1 ? '在职' : '离职'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                  {teacher.subjects && (
                    <span className="bg-gray-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-gray-400" />
                      {teacher.subjects}
                    </span>
                  )}
                  {teacher.hired_date && (
                    <span className="bg-gray-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {teacher.hired_date}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                    teacher.student_count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <Users className="w-3.5 h-3.5" />
                    {teacher.student_count || 0} 名学生
                  </span>
                </div>
                
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-base"
                    onClick={() => { setEditData(teacher); setModalOpen(true); }}
                  >
                    编辑
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-red-50 transition-base"
                    onClick={() => handleDelete(teacher.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 桌面端卡片 */}
      {loading ? (
        <div className="hidden md:block text-center py-12 text-gray-500">加载中...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="hidden md:block px-6">
          <Empty message="暂无教师数据" />
        </div>
      ) : (
        <div className="hidden md:block px-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher) => (
              <div 
                key={teacher.id} 
                className="bg-white rounded-xl shadow-sm p-5 card-hover cursor-pointer border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(teacher.name)} flex items-center justify-center text-white font-semibold text-lg`}>
                      {teacher.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{teacher.name}</h3>
                      <p className="text-sm text-gray-500">{teacher.phone || '暂无电话'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    teacher.status === 1 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {teacher.status === 1 ? '在职' : '离职'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  {teacher.subjects && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Music className="w-4 h-4 text-gray-400" />
                      <span>{teacher.subjects}</span>
                    </div>
                  )}
                  {teacher.hired_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>入职 {teacher.hired_date}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className={teacher.student_count > 0 ? 'text-blue-600 font-medium' : ''}>
                      {teacher.student_count || 0} 名学生
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button 
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-base"
                    onClick={() => { setEditData(teacher); setModalOpen(true); }}
                  >
                    编辑
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-base"
                    onClick={() => handleDelete(teacher.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
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
          saving={saving}
        />
      </Modal>
    </div>
  );
}

function TeacherForm({ data, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    phone: data?.phone || '',
    email: data?.email || '',
    subjects: data?.subjects || '',
    status: data?.status ?? 1,
    hired_date: data?.hired_date || '',
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="请输入教师姓名"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">电话</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="请输入联系电话"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="请输入邮箱"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">教授科目</label>
        <input
          type="text"
          value={form.subjects}
          onChange={(e) => setForm({ ...form, subjects: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="多个科目用逗号分隔，如：吉他,尤克里里"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">入职日期</label>
        <input
          type="date"
          value={form.hired_date}
          onChange={(e) => setForm({ ...form, hired_date: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
        >
          <option value={1}>在职</option>
          <option value={0}>离职</option>
        </select>
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
