const express = require('express');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 课时充值
router.post('/recharge', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { student_id, course_type_id, teacher_id, buy_hours, gift_hours, total_fee, practice_fee, recharge_date, memo } = req.body;

    if (!student_id || !course_type_id || !teacher_id || !buy_hours || total_fee === undefined) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 验证学生存在
    const students = await db.query('SELECT * FROM students WHERE id = ? AND status = ?', [student_id, 'active']);
    const student = students[0];
    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }

    // 验证教师存在
    const teachers = await db.query('SELECT * FROM teachers WHERE id = ? AND status = ?', [teacher_id, 'active']);
    if (!teachers[0]) {
      return res.status(400).json({ error: '教师不存在' });
    }

    // 验证课程类型存在
    const courseTypes = await db.query('SELECT * FROM course_types WHERE id = ? AND status = ?', [course_type_id, 'active']);
    if (!courseTypes[0]) {
      return res.status(400).json({ error: '课程类型不存在' });
    }

    const total_hours = (parseFloat(buy_hours) || 0) + (parseFloat(gift_hours) || 0);
    const course_fee = parseFloat(total_fee) || 0;  // 课程费（不含练琴费）
    const practiceFee = parseFloat(practice_fee) || 0;  // 练琴费
    const buy = parseFloat(buy_hours) || 0;
    // 教师单节费用 = 课程费 / 购买课时 / 2（不含练琴费）
    const unit_point_fee = buy > 0 ? course_fee / buy / 2 : 0;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 创建充值记录
    const [rechargeResult] = await connection.query(`
      INSERT INTO recharges (student_id, course_type_id, teacher_id, buy_hours, gift_hours, total_hours, total_fee, practice_fee, unit_point_fee, recharge_date, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, course_type_id, teacher_id, buy_hours, gift_hours || 0, total_hours, course_fee, practiceFee, unit_point_fee, recharge_date || new Date().toISOString().split('T')[0], memo]);

    const recharge_id = rechargeResult.insertId;

    // 2. 更新学生剩余课时
    await connection.query('UPDATE students SET remaining_hours = remaining_hours + ? WHERE id = ?', [total_hours, student_id]);

    // 3. 创建收入记录 - 课程费
    if (course_fee > 0) {
      await connection.query(`
        INSERT INTO transactions (type, amount, category, ref_id, ref_type, description, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['income', course_fee, '课时收入', recharge_id, 'recharge', `学生${student.name}充值${total_hours}课时`, recharge_date || new Date().toISOString().split('T')[0]]);
    }

    // 4. 创建收入记录 - 练琴费（独立分类）
    if (practiceFee > 0) {
      await connection.query(`
        INSERT INTO transactions (type, amount, category, ref_id, ref_type, description, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['income', practiceFee, '练琴费', recharge_id, 'recharge', `学生${student.name}练琴费`, recharge_date || new Date().toISOString().split('T')[0]]);
    }

    await connection.commit();

    res.json({ id: recharge_id, message: '充值成功', unit_point_fee });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Recharge error:', err);
    res.status(500).json({ error: '充值失败：' + (err.message || '未知错误') });
  } finally {
    if (connection) connection.release();
  }
});

// 获取充值记录
router.get('/recharges', authMiddleware, async (req, res) => {
  try {
    const { student_id, start_date, end_date } = req.query;

    let sql = `
      SELECT r.*,
        s.name as student_name,
        t.name as teacher_name,
        ct.name as course_type_name
      FROM recharges r
      LEFT JOIN students s ON s.id = r.student_id
      LEFT JOIN teachers t ON t.id = r.teacher_id
      LEFT JOIN course_types ct ON ct.id = r.course_type_id
      WHERE 1=1
    `;

    const params = [];

    if (student_id) {
      sql += ' AND r.student_id = ?';
      params.push(student_id);
    }

    if (start_date) {
      sql += ' AND r.recharge_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND r.recharge_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY r.recharge_date DESC, r.created_at DESC';

    const recharges = await db.query(sql, params);
    res.json(recharges);
  } catch (err) {
    res.status(500).json({ error: '获取充值记录失败：' + (err.message || '未知错误') });
  }
});

// 上课签到
router.post('/signin', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { student_id, hours, course_date, memo } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: '请选择学生' });
    }

    // 验证学生存在
    const students = await db.query(`
      SELECT s.*, ct.price as unit_price
      FROM students s
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE s.id = ? AND s.status = ?
    `, [student_id, 'active']);
    const student = students[0];

    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }

    const consumeHours = parseFloat(hours) || 1;

    // 检查剩余课时是否足够
    if (student.remaining_hours < consumeHours) {
      return res.status(400).json({ error: `剩余课时不足，当前剩余${student.remaining_hours}课时` });
    }

    // 获取该学生最近一次充值记录，用于计算教师费用
    const lastRecharges = await db.query(`
      SELECT * FROM recharges
      WHERE student_id = ? AND buy_hours > 0
      ORDER BY recharge_date DESC, id DESC
      LIMIT 1
    `, [student_id]);
    const lastRecharge = lastRecharges[0];

    const unit_fee = lastRecharge ? lastRecharge.unit_point_fee : 0;
    const total_fee = unit_fee * consumeHours;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 创建上课记录
    const [logResult] = await connection.query(`
      INSERT INTO course_logs (student_id, teacher_id, course_type_id, hours, unit_fee, total_fee, course_date, recharge_id, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      student_id,
      student.teacher_id,
      student.course_type_id,
      consumeHours,
      unit_fee,
      total_fee,
      course_date || new Date().toISOString(),
      lastRecharge ? lastRecharge.id : null,
      memo
    ]);

    const log_id = logResult.insertId;

    // 2. 扣减学生剩余课时
    await connection.query('UPDATE students SET remaining_hours = remaining_hours - ? WHERE id = ?', [consumeHours, student_id]);

    // 3. 创建支出记录（教师工资）
    if (total_fee > 0) {
      const courseDateStr = course_date ? new Date(course_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      await connection.query(`
        INSERT INTO transactions (type, amount, category, ref_id, ref_type, description, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['expense', total_fee, '教师工资', log_id, 'course', `学生${student.name}上课，教师${student.teacher_id}`, courseDateStr]);
    }

    await connection.commit();

    res.json({ id: log_id, message: '签到成功', remaining_hours: student.remaining_hours - consumeHours });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Signin error:', err);
    res.status(500).json({ error: '签到失败：' + (err.message || '未知错误') });
  } finally {
    if (connection) connection.release();
  }
});

// 获取上课记录
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const { student_id, teacher_id, start_date, end_date } = req.query;

    let sql = `
      SELECT cl.*,
        s.name as student_name,
        t.name as teacher_name,
        ct.name as course_type_name
      FROM course_logs cl
      LEFT JOIN students s ON s.id = cl.student_id
      LEFT JOIN teachers t ON t.id = cl.teacher_id
      LEFT JOIN course_types ct ON ct.id = cl.course_type_id
      WHERE 1=1
    `;

    const params = [];

    if (student_id) {
      sql += ' AND cl.student_id = ?';
      params.push(student_id);
    }

    if (teacher_id) {
      sql += ' AND cl.teacher_id = ?';
      params.push(teacher_id);
    }

    if (start_date) {
      sql += ' AND DATE(cl.course_date) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND DATE(cl.course_date) <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY cl.course_date DESC';

    const logs = await db.query(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: '获取上课记录失败：' + (err.message || '未知错误') });
  }
});

// 删除上课记录（退课）
router.delete('/logs/:id', authMiddleware, async (req, res) => {
  let connection;
  try {
    const logs = await db.query('SELECT * FROM course_logs WHERE id = ?', [req.params.id]);
    const log = logs[0];
    if (!log) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const students = await db.query('SELECT * FROM students WHERE id = ?', [log.student_id]);
    if (!students[0]) {
      return res.status(404).json({ error: '学生不存在' });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 恢复学生课时
    await connection.query('UPDATE students SET remaining_hours = remaining_hours + ? WHERE id = ?', [log.hours, log.student_id]);

    // 2. 删除关联的收入支出记录
    await connection.query('DELETE FROM transactions WHERE ref_id = ? AND ref_type = ?', [log.id, 'course']);

    // 3. 删除上课记录
    await connection.query('DELETE FROM course_logs WHERE id = ?', [log.id]);

    await connection.commit();

    res.json({ message: '退课成功' });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: '退课失败：' + (err.message || '未知错误') });
  } finally {
    if (connection) connection.release();
  }
});

// 获取课时统计
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = {
      total_students: 0,
      total_teachers: 0,
      total_recharges: 0,
      total_hours_sold: 0,
      total_hours_consumed: 0,
      total_remaining: 0
    };

    const studentCount = await db.query('SELECT COUNT(*) as count FROM students WHERE status = ?', ['active']);
    stats.total_students = studentCount[0].count;

    const teacherCount = await db.query('SELECT COUNT(*) as count FROM teachers WHERE status = ?', ['active']);
    stats.total_teachers = teacherCount[0].count;

    const rechargeCount = await db.query('SELECT COUNT(*) as count FROM recharges');
    stats.total_recharges = rechargeCount[0].count;

    const hoursSold = await db.query('SELECT COALESCE(SUM(total_hours), 0) as total FROM recharges');
    stats.total_hours_sold = hoursSold[0].total;

    const hoursConsumed = await db.query('SELECT COALESCE(SUM(hours), 0) as total FROM course_logs');
    stats.total_hours_consumed = hoursConsumed[0].total;

    const remaining = await db.query('SELECT COALESCE(SUM(remaining_hours), 0) as total FROM students WHERE status = ?', ['active']);
    stats.total_remaining = remaining[0].total;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '获取课时统计失败：' + (err.message || '未知错误') });
  }
});

// 课时不足提醒（剩余 <= 1）
router.get('/low-balance', authMiddleware, async (req, res) => {
  try {
    const students = await db.query(`
      SELECT s.*,
        t.name as teacher_name,
        ct.name as course_type_name
      FROM students s
      LEFT JOIN teachers t ON t.id = s.teacher_id
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE s.remaining_hours <= 1 AND s.status = 'active'
      ORDER BY s.remaining_hours ASC
    `);

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: '获取课时不足提醒失败：' + (err.message || '未知错误') });
  }
});

module.exports = router;
