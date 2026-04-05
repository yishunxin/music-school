const express = require('express');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 收支类别
const categories = {
  income: ['课时收入', '乐器销售', '其他收入'],
  expense: ['教师工资', '房租', '水电费', '乐器进货', '其他支出']
};

// 获取收支记录
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, category, start_date, end_date } = req.query;

    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (start_date) {
      sql += ' AND transaction_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND transaction_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY transaction_date DESC, created_at DESC';

    const transactions = await db.query(sql, params);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取收支类别
router.get('/categories', authMiddleware, (req, res) => {
  res.json(categories);
});

// 添加收支记录
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, amount, category, description, transaction_date } = req.body;

    if (!type || amount === undefined || !category || !transaction_date) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const result = await db.query(`
      INSERT INTO transactions (type, amount, category, description, transaction_date)
      VALUES (?, ?, ?, ?, ?)
    `, [type, amount, category, description, transaction_date]);

    res.json({ id: result.insertId, message: '添加成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新收支记录
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { type, amount, category, description, transaction_date } = req.body;

    const transactions = await db.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    const transaction = transactions[0];
    if (!transaction) {
      return res.status(404).json({ error: '记录不存在' });
    }

    await db.query(`
      UPDATE transactions SET
        type = COALESCE(?, type),
        amount = COALESCE(?, amount),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        transaction_date = COALESCE(?, transaction_date)
      WHERE id = ?
    `, [type, amount, category, description, transaction_date, req.params.id]);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除收支记录
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 检查是否有系统生成的关联记录（如课程签到产生的工资）
    const transactions = await db.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    const transaction = transactions[0];
    if (transaction && transaction.ref_type) {
      return res.status(400).json({ error: '系统生成的记录不能删除' });
    }

    await db.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 收支统计
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date) {
      dateFilter += ' AND transaction_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      dateFilter += ' AND transaction_date <= ?';
      params.push(end_date);
    }

    // 总收入
    const totalIncomeResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income' ${dateFilter}
    `, params);
    const totalIncome = totalIncomeResult[0].total;

    // 总支出
    const totalExpenseResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' ${dateFilter}
    `, params);
    const totalExpense = totalExpenseResult[0].total;

    // 按类别统计收入
    const incomeByCategory = await db.query(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'income' ${dateFilter}
      GROUP BY category
    `, params);

    // 按类别统计支出
    const expenseByCategory = await db.query(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'expense' ${dateFilter}
      GROUP BY category
    `, params);

    // 月度趋势（最近6个月）- MySQL 语法
    const monthlyTrend = await db.query(`
      SELECT
        DATE_FORMAT(transaction_date, '%Y-%m') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
      ORDER BY month
    `);

    res.json({
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      incomeByCategory,
      expenseByCategory,
      monthlyTrend
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 工资管理 - 获取月结记录
router.get('/salary', authMiddleware, async (req, res) => {
  try {
    const { teacher_id, month, status } = req.query;

    let sql = `
      SELECT ts.*,
        t.name as teacher_name,
        t.phone as teacher_phone
      FROM teacher_salary ts
      LEFT JOIN teachers t ON t.id = ts.teacher_id
      WHERE 1=1
    `;

    const params = [];

    if (teacher_id) {
      sql += ' AND ts.teacher_id = ?';
      params.push(teacher_id);
    }

    if (month) {
      sql += ' AND ts.month = ?';
      params.push(month);
    }

    if (status) {
      sql += ' AND ts.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ts.month DESC, ts.created_at DESC';

    const salaries = await db.query(sql, params);
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 工资管理 - 生成月结工资单
router.post('/salary/generate', authMiddleware, async (req, res) => {
  try {
    const { teacher_id, month } = req.body;

    if (!teacher_id || !month) {
      return res.status(400).json({ error: '请选择教师和月份' });
    }

    // 验证教师
    const teachers = await db.query('SELECT * FROM teachers WHERE id = ?', [teacher_id]);
    if (!teachers[0]) {
      return res.status(400).json({ error: '教师不存在' });
    }

    // 检查该月份是否已生成
    const existing = await db.query('SELECT * FROM teacher_salary WHERE teacher_id = ? AND month = ?', [teacher_id, month]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '该月份工资单已存在' });
    }

    // 计算该教师该月的所有课时费用
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const monthStatsResult = await db.query(`
      SELECT
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(total_fee), 0) as total_fee,
        AVG(unit_fee) as avg_unit_fee
      FROM course_logs
      WHERE teacher_id = ?
        AND DATE(course_date) >= ?
        AND DATE(course_date) <= ?
    `, [teacher_id, startDate, endDate]);
    const monthStats = monthStatsResult[0];

    if (monthStats.total_hours === 0) {
      return res.status(400).json({ error: '该月没有上课记录' });
    }

    // 创建工资单
    const result = await db.query(`
      INSERT INTO teacher_salary (teacher_id, month, total_hours, unit_price, total_fee)
      VALUES (?, ?, ?, ?, ?)
    `, [teacher_id, month, monthStats.total_hours, monthStats.avg_unit_fee, monthStats.total_fee]);

    res.json({ id: result.insertId, message: '工资单生成成功', total_fee: monthStats.total_fee });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 工资管理 - 确认发放
router.post('/salary/pay', authMiddleware, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: '请选择工资单' });
    }

    const salaries = await db.query('SELECT * FROM teacher_salary WHERE id = ?', [id]);
    const salary = salaries[0];
    if (!salary) {
      return res.status(404).json({ error: '工资单不存在' });
    }

    if (salary.status === 'paid') {
      return res.status(400).json({ error: '该工资单已发放' });
    }

    // 更新状态
    await db.query('UPDATE teacher_salary SET status = ?, paid_at = ? WHERE id = ?', ['paid', new Date().toISOString(), id]);

    res.json({ message: '发放成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取教师课时明细（用于月结核对）
router.get('/teacher-month/:teacher_id/:month', authMiddleware, async (req, res) => {
  try {
    const { teacher_id, month } = req.params;
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const logs = await db.query(`
      SELECT cl.*,
        s.name as student_name,
        ct.name as course_type_name
      FROM course_logs cl
      LEFT JOIN students s ON s.id = cl.student_id
      LEFT JOIN course_types ct ON ct.id = cl.course_type_id
      WHERE cl.teacher_id = ?
        AND DATE(cl.course_date) >= ?
        AND DATE(cl.course_date) <= ?
      ORDER BY cl.course_date
    `, [teacher_id, startDate, endDate]);

    const summaryResult = await db.query(`
      SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(total_fee), 0) as total_fee
      FROM course_logs
      WHERE teacher_id = ?
        AND DATE(course_date) >= ?
        AND DATE(course_date) <= ?
    `, [teacher_id, startDate, endDate]);

    res.json({ logs, summary: summaryResult[0] });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
