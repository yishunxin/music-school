import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, User } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { users } from '../api';

export default function Users() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await users.list();
      setUserList(res.data);
    } catch (err) {
      console.error('加载账号列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
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

  const filteredUsers = userList.filter((u) =>
    u.username?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">账号管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户账号</p>
        </div>
        <Button onClick={() => { setEditData(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          添加账号
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </Card>

      {/* User List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredUsers.length === 0 ? (
        <Empty message="暂无账号数据" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">用户名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">角色</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-sm rounded ${
                        user.status === 1
                          ? 'bg-success/10 text-success'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.status === 1 ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditData(user); setModalOpen(true); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-error hover:bg-error/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
        />
      </Modal>
    </div>
  );
}

function UserForm({ data, onSave, onCancel }) {
  const [form, setForm] = useState({
    username: data?.username || '',
    password: '',
    role: data?.role || 'user',
    status: data?.status ?? 1,
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username) {
      alert('请输入用户名');
      return;
    }
    if (!editData && (!form.password || form.password.length < 6)) {
      alert('密码长度不能少于6位');
      return;
    }
    if (!editData && form.password !== confirmPassword) {
      alert('两次密码输入不一致');
      return;
    }

    const submitData = { ...form };
    if (!submitData.password) delete submitData.password;
    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="请输入用户名"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          密码 {editData && '(不修改请留空)'}
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder={editData ? '不修改请留空' : '请输入密码'}
        />
      </div>

      {!editData && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确认密码 *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="请再次输入密码"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value={1}>启用</option>
          <option value={0}>禁用</option>
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
