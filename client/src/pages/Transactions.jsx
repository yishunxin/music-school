import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet, Calculator, Briefcase, AlertCircle, Calendar, BookOpen } from 'lucide-react';
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
      setRecords(recordsRes.data || []);
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

  const netProfit = summary.income - summary.expense;
  const balance = summary.income - summary.expense; // 简化:账户余额 = 累计收入 - 累计支出

  // 模拟教师工资数据 (从 teacher_salary 接口读取)
  const salaryRecords = [
    { id: 1, teacher: '张老师', subjects: '钢琴、古筝', month: '2026-03', hours: 24, amount: 2400, status: 'paid' },
    { id: 2, teacher: '李老师', subjects: '小提琴、钢琴', month: '2026-03', hours: 18, amount: 1800, status: 'pending' },
  ];

  const getSalaryColor = (name) => {
    const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-orange-500 to-orange-600', 'from-purple-500 to-purple-600'];
    return colors[name?.charCodeAt(0) % colors.length] || colors[0];
  };

  return (
    <div className="pb-6">
      {/* 移动端紫色渐变 finance-summary - 对齐设计稿 */}
      <div className="md:hidden">
        <div
          className="px-5 pt-6 pb-6 text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-blue-100">账户余额</p>
              <h1 className="text-2xl font-bold mt-1">财务管理</h1>
            </div>
            <button
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="mt-2 mb-1">
            <p className="text-sm text-blue-100 mb-1">账户余额</p>
            <p className="text-[32px] leading-none font-bold">¥{balance.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/20">
              <div className="text-[11px] text-blue-100 mb-1">本月收入</div>
              <div className="text-xl font-bold text-[#86EFAC]">+¥{summary.income.toLocaleString()}</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/20">
              <div className="text-[11px] text-blue-100 mb-1">本月支出</div>
              <div className="text-xl font-bold text-[#FCA5A5]">-¥{summary.expense.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端标题区域 */}
      <div className="hidden md:flex md:items-center md:justify-between md:px-6 md:pt-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">财务管理</h1>
          <p className="text-gray-500 mt-1">收支记录、统计报表</p>
        </div>
        <button
          className="btn-primary bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          添加记录
        </button>
      </div>

      {/* 桌面端收支汇总 */}
      <div className="hidden md:block px-6 mt-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">总收入</p>
                <p className="text-2xl font-bold text-green-600 mt-1">¥{summary.income.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">总支出</p>
                <p className="text-2xl font-bold text-red-600 mt-1">¥{summary.expense.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">净利润</p>
                <p className="text-2xl font-bold text-white mt-1">¥{netProfit.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Buttons - 移动端 - 4-Tab 横向(全部/收入/支出/工资) 对齐设计稿 */}
      <div className="md:hidden px-4 mt-4">
        <div className="flex bg-white border-b border-gray-200">
          {['all', 'income', 'expense', 'salary'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-[#3B82F6]'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'income' ? '收入' : tab === 'expense' ? '支出' : '工资'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-[#3B82F6] rounded-t-md" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Buttons - 桌面端 */}
      <div className="hidden md:block px-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-1.5 inline-flex gap-1">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部
          </button>
          <button
            className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            收入
          </button>
          <button
            className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense')}
          >
            支出
          </button>
          <button
            className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            工资
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 md:px-6 mt-4">
        {/* 收支/工资列表 */}
        {activeTab !== 'salary' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : records.length === 0 ? (
              <Empty message="暂无记录" />
            ) : (
              records.map((record, idx) => (
                <div key={idx} className="bg-white rounded-xl p-3.5 md:p-4 shadow-sm flex items-center gap-3">
                  <div className={`w-10 h-10 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    record.type === 'income' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]'
                  }`}>
                    {record.type === 'income'
                      ? <BookOpen className="w-5 h-5" />
                      : <TrendingDown className="w-5 h-5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{record.description || (record.type === 'income' ? '收入' : '支出')}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(record.transaction_date)}</p>
                  </div>
                  <span className={`text-base md:text-lg font-semibold shrink-0 ${record.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {record.type === 'income' ? '+' : '-'}¥{Number(record.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* 工资列表 */}
        {activeTab === 'salary' && (
          <div className="space-y-3">
            {/* 提示条 - 对齐设计稿 */}
            <div className="p-3 bg-[#FEF3C7] rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#92400E] leading-relaxed">
                工资由系统根据实际上课记录自动结算，无需手动生成
              </span>
            </div>

            {/* 移动端工资卡片 */}
            <div className="md:hidden space-y-3">
              {salaryRecords.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#FEF2F2] text-[#EF4444]`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.teacher} - {s.month}工资</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{s.hours}课时 · {s.status === 'paid' ? '已发放' : '待发放'}</p>
                  </div>
                  <span className="text-base font-semibold text-[#EF4444] shrink-0">-¥{s.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* 桌面端工资表格 */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#3B82F6]" />
                  教师工资
                </h2>
                <button className="btn-primary bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  生成月结
                </button>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">教师</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">月份</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">上课课时</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">应发工资</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salaryRecords.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-base">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getSalaryColor(s.teacher)} flex items-center justify-center text-white font-semibold`}>{s.teacher?.charAt(0)}</div>
                          <div>
                            <p className="font-medium text-gray-900">{s.teacher}</p>
                            <p className="text-sm text-gray-500">{s.subjects}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{s.month}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{s.hours} 课时</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">¥{s.amount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status === 'paid' ? '已发放' : '待发放'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium">查看详情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 添加记录 Modal (占位) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="添加财务记录"
      >
        <div className="p-2 text-sm text-gray-500">添加功能待实现</div>
      </Modal>
    </div>
  );
}
