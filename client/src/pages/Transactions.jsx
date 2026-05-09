import { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, Wallet, Download } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { transactions } from '../api';
import { formatDate, formatMoney } from '../utils/format';

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('all');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { type: activeTab === 'all' ? undefined : activeTab };
      const [recordsRes, summaryRes] = await Promise.all([
        transactions.list(params),
        transactions.summary(),
      ]);
      setRecords(recordsRes.data);
      if (summaryRes.data) {
        setSummary({
          income: summaryRes.data.income || 0,
          expense: summaryRes.data.expense || 0,
        });
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">财务管理</h1>
          <p className="text-gray-500 mt-1">收支记录和统计报表</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          记一笔
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总收入</p>
              <p className="text-xl font-bold text-success">¥{formatMoney(summary.income)}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总支出</p>
              <p className="text-xl font-bold text-error">¥{formatMoney(summary.expense)}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4 md:col-span-1 col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">结余</p>
              <p className="text-xl font-bold text-primary">
                ¥{formatMoney(summary.income - summary.expense)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
        {[
          { key: 'all', label: '全部' },
          { key: 'income', label: '收入' },
          { key: 'expense', label: '支出' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Records */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : records.length === 0 ? (
        <Empty message="暂无记录" />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    record.type === 'income' ? 'bg-success/10' : 'bg-error/10'
                  }`}>
                    {record.type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-error" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{record.description || (record.type === 'income' ? '收入' : '支出')}</p>
                    <p className="text-sm text-gray-500">{record.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    record.type === 'income' ? 'text-success' : 'text-error'
                  }`}>
                    {record.type === 'income' ? '+' : '-'}¥{formatMoney(record.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="记一笔"
      >
        <TransactionForm
          onSave={() => { setModalOpen(false); loadData(); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function TransactionForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = {
    income: ['课时收入', '其他收入'],
    expense: ['教师工资', '场地费用', '教材采购', '其他支出'],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      alert('请输入有效金额');
      return;
    }
    if (!form.category) {
      alert('请选择分类');
      return;
    }

    setSubmitting(true);
    try {
      await transactions.create(form);
      onSave();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setForm({ ...form, type: 'income', category: '' })}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
            form.type === 'income'
              ? 'bg-success text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          收入
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, type: 'expense', category: '' })}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
            form.type === 'expense'
              ? 'bg-error text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          支出
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">金额 *</label>
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">请选择分类</option>
          {categories[form.type].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="备注信息（可选）"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" loading={submitting}>
          保存
        </Button>
      </div>
    </form>
  );
}
