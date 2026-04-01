import { useState, useEffect } from 'react';
import { getCourseTypes, createCourseType, updateCourseType, deleteCourseType } from '../api';

export default function CourseTypes() {
  const [courseTypes, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', subject: '', level: 1, hours_unit: 1, price: '', memo: '' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const { data } = await getCourseTypes();
      setCourseTypes(data);
    } catch (err) {
      console.error('获取课程类型失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const submitData = { ...formData, level: parseInt(formData.level) || 1, hours_unit: parseFloat(formData.hours_unit) || 1, price: parseFloat(formData.price) };
      if (editingItem) {
        await updateCourseType(editingItem.id, submitData);
      } else {
        await createCourseType(submitData);
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '', subject: '', level: 1, hours_unit: 1, price: '', memo: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      subject: item.subject,
      level: item.level,
      hours_unit: item.hours_unit,
      price: item.price,
      memo: item.memo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该课程类型吗？')) return;
    try {
      await deleteCourseType(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', subject: '', level: 1, hours_unit: 1, price: '', memo: '' });
    setError('');
    setShowModal(true);
  };

  const handleSubjectChange = (subject) => {
    const level = formData.level || 1;
    setFormData({
      ...formData,
      subject,
      name: `${subject}${level}级`
    });
  };

  const handleLevelChange = (level) => {
    const subject = formData.subject || '';
    setFormData({
      ...formData,
      level,
      name: subject ? `${subject}${level}级` : ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">课程类型管理</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + 添加课程类型
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseTypes.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.subject} · {item.level}级</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.status === 'active' ? '启用' : '停用'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>课时时长:</span>
                  <span className="font-medium">{item.hours_unit} 小时/节</span>
                </div>
                <div className="flex justify-between">
                  <span>单节单价:</span>
                  <span className="font-medium text-blue-600">¥{item.price}</span>
                </div>
                {item.memo && <p className="text-gray-500 text-xs">备注: {item.memo}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
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
            <h2 className="text-xl font-bold mb-4">{editingItem ? '编辑课程类型' : '添加课程类型'}</h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">乐器类型</label>
                <select
                  value={formData.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">请选择</option>
                  <option value="钢琴">钢琴</option>
                  <option value="小提琴">小提琴</option>
                  <option value="吉他">吉他</option>
                  <option value="古筝">古筝</option>
                  <option value="架子鼓">架子鼓</option>
                  <option value="声乐">声乐</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">级别</label>
                <select
                  value={formData.level}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                    <option key={l} value={l}>{l}级</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="自动生成"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单节课时长 (小时)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hours_unit}
                  onChange={(e) => setFormData({ ...formData, hours_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单节单价 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
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