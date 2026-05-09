import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Music } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { courseTypes } from '../api';

export default function CourseTypes() {
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadCourseTypes();
  }, []);

  const loadCourseTypes = async () => {
    try {
      const res = await courseTypes.list();
      setCourseList(res.data);
    } catch (err) {
      console.error('加载课程类型失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
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
    c.name?.includes(search) || c.level?.toString().includes(search)
  );

  // 按乐器类型分组
  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const key = course.name || '未分类';
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">课程类型</h1>
          <p className="text-gray-500 mt-1">管理乐器类型和课程级别</p>
        </div>
        <Button onClick={() => { setEditData(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          添加课程
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索课程名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </Card>

      {/* Course List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : Object.keys(groupedCourses).length === 0 ? (
        <Empty message="暂无课程类型" />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCourses).map(([name, courses]) => (
            <Card key={name}>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-800">{name}</h3>
                <span className="text-sm text-gray-500">({courses.length}个级别)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{course.name}</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          {course.level}级
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        ¥{Number(course.price || 0).toFixed(2)}/课时
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditData(course); setModalOpen(true); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                        className="text-error hover:bg-error/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
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
        />
      </Modal>
    </div>
  );
}

function CourseTypeForm({ data, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    subject: data?.subject || '',
    level: data?.level || 1,
    price: data?.price || '',
    description: data?.description || '',
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
        <label className="block text-sm font-medium text-gray-700 mb-1">乐器类型 *</label>
        <select
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">课程名称 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="如：初级班、进阶班"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">级别 *</label>
        <select
          value={form.level}
          onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
            <option key={l} value={l}>{l}级</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">单价(元/课时) *</label>
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="请输入课程单价"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="课程描述（可选）"
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
