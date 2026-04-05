import { useState, useEffect } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionStats, getTransactionCategories, getSalaries, generateSalary, paySalary, getTeachers } from '../api';

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('list');
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ type: 'income', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');

  // 工资相关
  const [teachers, setTeachers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaryTeacherId, setSalaryTeacherId] = useState('');
  const [salaryError, setSalaryError] = useState('');
  const [salarySuccess, setSalarySuccess] = useState('');

  const fetchData = async () => {
    try {
      const [transRes, statsRes, catsRes, teachersRes] = await Promise.all([
        getTransactions(),
        getTransactionStats(),
        getTransactionCategories(),
        getTeachers({ status: 'active' })
      ]);
      setTransactions(transRes.data);
      setStats(statsRes.data);
      setCategories(catsRes.data);
      setTeachers(teachersRes.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaries = async () => {
    try {
      const { data } = await getSalaries();
      setSalaries(data);
    } catch (err) {
      console.error('获取工资记录失败:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'salary') {
      fetchSalaries();
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const submitData = { ...formData, amount: parseFloat(formData.amount) };
      if (editingItem) {
        await updateTransaction(editingItem.id, submitData);
      } else {
        await createTransaction(submitData);
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ type: 'income', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      amount: item.amount,
      category: item.category,
      description: item.description || '',
      transaction_date: item.transaction_date
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该记录吗？')) return;
    try {
      await deleteTransaction(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const openAddModal = (type = 'income') => {
    setEditingItem(null);
    setFormData({ type, amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
    setError('');
    setShowModal(true);
  };

  const handleGenerateSalary = async () => {
    if (!salaryTeacherId || !salaryMonth) {
      setSalaryError('请选择教师和月份');
      return;
    }
    setSalaryError('');
    setSalarySuccess('');

    try {
      await generateSalary({ teacher_id: parseInt(salaryTeacherId), month: salaryMonth });
      setSalarySuccess('工资单生成成功！');
      fetchSalaries();
    } catch (err) {
      setSalaryError(err.response?.data?.error || '生成失败');
    }
  };

  const handlePaySalary = async (id) => {
    if (!confirm('确认发放工资？')) return;
    try {
      await paySalary(id);
      fetchSalaries();
    } catch (err) {
      alert(err.response?.data?.error || '发放失败');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">财务管理</h1>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        {['list', 'stats', 'salary'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'list' ? '收支记录' : tab === 'stats' ? '统计报表' : '工资管理'}
          </button>
        ))}
      </div>

      {/* 收支记录 */}
      {activeTab === 'list' && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => openAddModal('income')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              + 记收入
            </button>
            <button
              onClick={() => openAddModal('expense')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              + 记支出
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">说明</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{item.transaction_date}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.type === 'income' ? '收入' : '支出'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'}¥{item.amount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-48 truncate">{item.description || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {!item.ref_type && (
                        <>
                          <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">删除</button>
                        </>
                      )}
                      {item.ref_type && <span className="text-gray-400 text-xs">系统记录</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center py-10 text-gray-500">暂无数据</div>
            )}
          </div>
        </>
      )}

      {/* 统计报表 */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-5">
              <p className="text-sm text-green-600">总收入</p>
              <p className="text-2xl font-bold text-green-700">¥{Number(stats.totalIncome || 0).toFixed(2)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5">
              <p className="text-sm text-red-600">总支出</p>
              <p className="text-2xl font-bold text-red-700">¥{Number(stats.totalExpense || 0).toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-5">
              <p className="text-sm text-blue-600">净利润</p>
              <p className="text-2xl font-bold text-blue-700">¥{Number(stats.netProfit || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3">收入分类</h3>
              <div className="space-y-2">
                {stats.incomeByCategory?.map((item) => (
                  <div key={item.category} className="flex justify-between items-center">
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-medium text-green-600">¥{Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
                {(!stats.incomeByCategory || stats.incomeByCategory.length === 0) && (
                  <p className="text-gray-400 text-sm">暂无数据</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3">支出分类</h3>
              <div className="space-y-2">
                {stats.expenseByCategory?.map((item) => (
                  <div key={item.category} className="flex justify-between items-center">
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-medium text-red-600">¥{Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
                {(!stats.expenseByCategory || stats.expenseByCategory.length === 0) && (
                  <p className="text-gray-400 text-sm">暂无数据</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3">月度趋势 (最近6个月)</h3>
            <div className="space-y-2">
              {stats.monthlyTrend?.map((item) => (
                <div key={item.month} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.month}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">收入 ¥{Number(item.income || 0).toFixed(2)}</span>
                    <span className="text-red-600">支出 ¥{Number(item.expense || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {(!stats.monthlyTrend || stats.monthlyTrend.length === 0) && (
                <p className="text-gray-400 text-sm">暂无数据</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 工资管理 */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">生成月结工资单</h3>

            {salaryError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{salaryError}</div>}
            {salarySuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">{salarySuccess}</div>}

            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择教师</label>
                <select
                  value={salaryTeacherId}
                  onChange={(e) => setSalaryTeacherId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">请选择</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">月份</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handleGenerateSalary}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                生成工资单
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">教师</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">月份</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总课时</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单价的点</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工资总额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{s.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.teacher_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.month}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.total_hours}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">¥{Number(s.unit_price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">¥{Number(s.total_fee || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.status === 'paid' ? '已发放' : '待发放'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.status === 'pending' && (
                        <button
                          onClick={() => handlePaySalary(s.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          确认发放
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {salaries.length === 0 && (
              <div className="text-center py-10 text-gray-500">暂无工资记录</div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingItem ? '编辑记录' : `记${formData.type === 'income' ? '收入' : '支出'}`}</h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金额 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">请选择</option>
                  {categories[formData.type]?.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">说明</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  className={`px-4 py-2 text-white rounded-lg hover:bg-opacity-90 transition ${formData.type === 'income' ? 'bg-green-600' : 'bg-red-600'}`}
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