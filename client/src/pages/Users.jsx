import { useState, useEffect } from 'react';
import { Plus, UserCircle } from 'lucide-react';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { users } from '../api';

export default function Users() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await users.list();
      setUserList(res.data || []);
    } catch (err) {
      console.error('加载账号列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editData) {
        await users.update(editData.id, data);
      } else {
        await users.create(data);
      }
      setModalOpen(false);
      setEditData(null);
      loadUsers();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该账号吗？')) return;
    try {
      await users.delete(id);
      loadUsers();
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'super_admin') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">超级管理员</span>;
    }
    if (role === 'admin') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">管理员</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">普通用户</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">账号管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户</p>
        </div>
        <button 
          className="btn-primary bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2"
          onClick={() => { setEditData(null); setModalOpen(true); }}
        >
          <Plus className="w-5 h-5" />
          添加账号
        </button>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : userList.length === 0 ? (
        <Empty message="暂无账号数据" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">用户</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">角色</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">创建时间</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">最后登录</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userList.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-base">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white font-semibold">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">管理员账号</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {user.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <button 
                      className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium mr-4"
                      onClick={() => { setEditData(user); setModalOpen(true); }}
                    >
                      编辑
                    </button>
                    {user.role !== 'super_admin' && (
                      <button 
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                        onClick={() => handleDelete(user.id)}
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        title={editData ? '编辑账号' : '添加账号'}
      >
        <UserForm
          data={editData}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditData(null); }}
          saving={saving}
        />
      </Modal>
    </div>
  );
}

function UserForm({ data, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    username: data?.username || '',
    password: '',
    role: data?.role || 'user',
    status: data?.status ?? 1,
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) {
      alert('请输入用户名');
      return;
    }
    if (!data && (!form.password || form.password.length < 6)) {
      alert('密码长度不能少于6位');
      return;
    }
    if (!data && form.password !== confirmPassword) {
      alert('两次密码输入不一致');
      return;
    }

    try {
      const submitData = { ...form };
      if (!submitData.password) delete submitData.password;
      await onSave(submitData);
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名 *</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder="请输入用户名"
          disabled={!!data}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          密码 {data && '(不修改请留空)'}
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
          placeholder={data ? '不修改请留空' : '请输入密码'}
        />
      </div>

      {!data && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码 *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800"
            placeholder="请再次输入密码"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">角色</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
        >
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
          {data?.role === 'super_admin' && (
            <option value="super_admin">超级管理员</option>
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
        >
          <option value={1}>启用</option>
          <option value={0}>禁用</option>
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
          className="btn-primary bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl font-medium shadow-md disabled:opacity-70"
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
