import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Music, Piano, Music2, X } from 'lucide-react';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { courseTypes } from '../api';

export default function CourseTypes() {
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCourseTypes();
  }, []);

  const loadCourseTypes = async () => {
    try {
      const res = await courseTypes.list();
      setCourseList(res.data || []);
    } catch (err) {
      console.error('加载课程类型失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editData) {
        await courseTypes.update(editData.id, data);
      } else {
        await courseTypes.create(data);
      }
      setModalOpen(false);
      setEditData(null);
      loadCourseTypes();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该课程类型吗？')) return;
    try {
      await courseTypes.delete(id);
      loadCourseTypes();
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredCourses = courseList.filter((c) =>
    c.name?.includes(search) || c.subject?.includes(search)
  );

  // 获取图标
  const getCourseIcon = (subject) => {
    if (subject?.includes('钢琴')) return Piano;
    if (subject?.includes('吉他') || subject?.includes('尤克里里')) return Music2;
    return Music;
  };

  // 获取图标颜色
  const getIconBgColor = (subject) => {
    if (subject?.includes('钢琴')) return 'bg-blue-100 text-blue-600';
    if (subject?.includes('吉他') || subject?.includes('尤克里里')) return 'bg-amber-100 text-amber-600';
    if (subject?.includes('古筝')) return 'bg-orange-100 text-orange-600';
    if (subject?.includes('小提琴')) return 'bg-purple-100 text-purple-600';
    if (subject?.includes('架子鼓')) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  // 获取级别标签
  const getLevelLabel = (level) => {
    if (level === 1) return '入门课程';
    if (level <= 3) return '初级课程';
    if (level <= 6) return '中级课程';
    return '高级课程';
  };

  return (
    <div className="pb-6">
      {/* 移动端标题区域 */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 pt-6 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">课程类型</h1>
              <p className="text-blue-100 mt-1 text-sm">共 {courseList.length} 种课程</p>
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
                placeholder="搜索课程名称..."
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
          <h1 className="text-2xl font-bold text-gray-900">课程类型</h1>
          <p className="text-gray-500 mt-1">共 {courseList.length} 种课程</p>
        </div>
        <button 
          className="btn-primary bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2"
          onClick={() => { setEditData(null); setModalOpen(true); }}
        >
          <Plus className="w-5 h-5" />
          添加课程
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
              placeholder="搜索课程名称..."
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
        ) : filteredCourses.length === 0 ? (
          <div className="py-12">
            <Empty message="暂无课程类型" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCourses.map((course) => {
              const Icon = getCourseIcon(course.subject);
              return (
                <div 
                  key={course.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getIconBgColor(course.subject)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.subject} · {getLevelLabel(course.level)}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      course.status === 1 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {course.status === 1 ? '启用' : '停用'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">课时时长</span>
                      <span className="font-medium">1 小时/节</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">单节单价</span>
                      <span className="font-medium text-blue-600">¥{Number(course.price || 0).toFixed(0)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button 
                      className="flex-1 text-gray-500 hover:text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-100 transition-base"
                      onClick={() => { setEditData(course); setModalOpen(true); }}
                    >
                      编辑
                    </button>
                    <button 
                      className="flex-1 text-red-500 hover:text-red-700 text-sm font-medium py-2 rounded-lg hover:bg-red-50 transition-base"
                      onClick={() => handleDelete(course.id)}
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

      {/* 桌面端卡片 */}
      {loading ? (
        <div className="hidden md:block text-center py-12 text-gray-500">加载中...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="hidden md:block px-6">
          <Empty message="暂无课程类型" />
        </div>
      ) : (
        <div className="hidden md:block px-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCourses.map((course) => {
              const Icon = getCourseIcon(course.subject);
              return (
                <div 
                  key={course.id} 
                  className="bg-white rounded-xl shadow-sm p-5 card-hover cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconBgColor(course.subject)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">{getLevelLabel(course.level)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">课时时长</span>
                      <span className="font-medium">1 小时/节</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">单节单价</span>
                      <span className="font-medium text-blue-600">¥{Number(course.price || 0).toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      course.status === 1 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {course.status === 1 ? '启用' : '停用'}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        className="text-gray-400 hover:text-gray-600 p-1"
                        onClick={(e) => { e.stopPropagation(); setEditData(course); setModalOpen(true); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-red-600 p-1"
                        onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        title={editData ? '编辑课程' : '添加课程'}
      >
        <CourseTypeForm
          data={editData}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditData(null); }}
          saving={saving}
        />
      </Modal>
    </div>
  );
}

function CourseTypeForm({ data, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    subject: data?.subject || '',
    level: data?.level || 1,
    price: data?.price || '',
    description: data?.description || '',
    status: data?.status ?? 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      alert('请输入课程名称');
      return;
    }
    if (!form.subject) {
      alert('请选择乐器类型');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      alert('请输入有效的课程单价');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">乐器类型 *</label>
        <select
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
        >
          <option value="">请选择乐器</option>
          <option value="吉他">吉他</option>
          <option value="钢琴">钢琴</option>
          <option value="架子鼓">架子鼓</option>
          <option value="小提琴">小提琴</option>
          <option value="古筝">古筝</option>
          <option value="二胡">二胡</option>
          <option value="尤克里里">尤克里里</option>
          <option value="声乐">声乐</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">课程名称 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="如：初级班、进阶班"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">级别 *</label>
        <select
          value={form.level}
          onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
            <option key={l} value={l}>{l}级</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">单价(元/课时) *</label>
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="请输入课程单价"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
        >
          <option value={1}>启用</option>
          <option value={0}>停用</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="课程描述（可选）"
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
