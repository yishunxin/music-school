const express = require('express');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 课时充值
router.post('/recharge', authMiddleware, (req, res) => {
  try {
    const { student_id, course_type_id, teacher_id, buy_hours, gift_hours, total_fee, recharge_date, memo } = req.body;

    if (!student_id || !course_type_id || !teacher_id || !buy_hours || total_fee === undefined) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 验证学生存在
    const student = db.prepare('SELECT * FROM students WHERE id = ? AND status = ?').get(student_id, 'active');
    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }

    // 验证教师存在
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ? AND status = ?').get(teacher_id, 'active');
    if (!teacher) {
      return res.status(400).json({ error: '教师不存在' });
    }

    // 验证课程类型存在
    const courseType = db.prepare('SELECT * FROM course_types WHERE id = ? AND status = ?').get(course_type_id, 'active');
    if (!courseType) {
      return res.status(400).json({ error: '课程类型不存在' });
    }

    const total_hours = (parseFloat(buy_hours) || 0) + (parseFloat(gift_hours) || 0);
    const fee = parseFloat(total_fee) || 0;
    const buy = parseFloat(buy_hours) || 0;
    // 每节个点费 = 总费用 / 购买课时 / 2
    const unit_point_fee = buy > 0 ? fee / buy / 2 : 0;

    // 开启事务
    const transaction = db.transaction(() => {
      // 1. 创建充值记录
      const rechargeResult = db.prepare(`
        INSERT INTO recharges (student_id, course_type_id, teacher_id, buy_hours, gift_hours, total_hours, total_fee, unit_point_fee, recharge_date, memo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(student_id, course_type_id, teacher_id, buy_hours, gift_hours || 0, total_hours, fee, unit_point_fee, recharge_date || new Date().toISOString().split('T')[0], memo);

      // 2. 更新学生剩余课时
      db.prepare('UPDATE students SET remaining_hours = remaining_hours + ? WHERE id = ?').run(total_hours, student_id);

      // 3. 创建收入记录
      db.prepare(`
        INSERT INTO transactions (type, amount, category, ref_id, ref_type, description, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('income', fee, '课时收入', rechargeResult.lastInsertRowid, 'recharge', `学生${student.name}充值${total_hours}课时`, recharge_date || new Date().toISOString().split('T')[0]);

      return rechargeResult.lastInsertRowid;
    });

    const recharge_id = transaction();

    res.json({ id: recharge_id, message: '充值成功', unit_point_fee });
  } catch (err) {
    console.error('Recharge error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取充值记录
router.get('/recharges', authMiddleware, (req, res) => {
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

    const recharges = db.prepare(sql).all(...params);
    res.json(recharges);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 上课签到
router.post('/signin', authMiddleware, (req, res) => {
  try {
    const { student_id, hours, course_date, memo } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: '请选择学生' });
    }

    // 验证学生存在
    const student = db.prepare(`
      SELECT s.*, ct.price as unit_price
      FROM students s
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE s.id = ? AND s.status = ?
    `).get(student_id, 'active');

    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }

    const consumeHours = parseFloat(hours) || 1;

    // 检查剩余课时是否足够
    if (student.remaining_hours < consumeHours) {
      return res.status(400).json({ error: `剩余课时不足，当前剩余${student.remaining_hours}课时` });
    }

    // 获取该学生最近一次充值记录，用于计算教师费用
    const lastRecharge = db.prepare(`
      SELECT * FROM recharges
      WHERE student_id = ? AND buy_hours > 0
      ORDER BY recharge_date DESC, id DESC
      LIMIT 1
    `).get(student_id);

    const unit_fee = lastRecharge ? lastRecharge.unit_point_fee : 0;
    const total_fee = unit_fee * consumeHours;

    // 开启事务
    const transaction = db.transaction(() => {
      // 1. 创建上课记录
      const logResult = db.prepare(`
        INSERT INTO course_logs (student_id, teacher_id, course_type_id, hours, unit_fee, total_fee, course_date, recharge_id, memo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        student_id,
        student.teacher_id,
        student.course_type_id,
        consumeHours,
        unit_fee,
        total_fee,
        course_date || new Date().toISOString(),
        lastRecharge ? lastRecharge.id : null,
        memo
      );

      // 2. 扣减学生剩余课时
      db.prepare('UPDATE students SET remaining_hours = remaining_hours - ? WHERE id = ?').run(consumeHours, student_id);

      // 3. 创建支出记录（教师工资）
      if (total_fee > 0) {
        const courseDateStr = course_date ? new Date(course_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        db.prepare(`
          INSERT INTO transactions (type, amount, category, ref_id, ref_type, description, transaction_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('expense', total_fee, '教师工资', logResult.lastInsertRowid, 'course', `学生${student.name}上课，教师${student.teacher_id}`, courseDateStr);
      }

      return logResult.lastInsertRowid;
    });

    const log_id = transaction();

    res.json({ id: log_id, message: '签到成功', remaining_hours: student.remaining_hours - consumeHours });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取上课记录
router.get('/logs', authMiddleware, (req, res) => {
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

    const logs = db.prepare(sql).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除上课记录（退课）
router.delete('/logs/:id', authMiddleware, (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM course_logs WHERE id = ?').get(req.params.id);
    if (!log) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(log.student_id);
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 开启事务
    const transaction = db.transaction(() => {
      // 1. 恢复学生课时
      db.prepare('UPDATE students SET remaining_hours = remaining_hours + ? WHERE id = ?').run(log.hours, log.student_id);

      // 2. 删除关联的收入支出记录
      db.prepare('DELETE FROM transactions WHERE ref_id = ? AND ref_type = ?').run(log.id, 'course');

      // 3. 删除上课记录
      db.prepare('DELETE FROM course_logs WHERE id = ?').run(log.id);
    });

    transaction();

    res.json({ message: '退课成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取课时统计
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const stats = {
      total_students: 0,
      total_teachers: 0,
      total_recharges: 0,
      total_hours_sold: 0,
      total_hours_consumed: 0,
      total_remaining: 0
    };

    stats.total_students = db.prepare('SELECT COUNT(*) as count FROM students WHERE status = ?').get('active').count;
    stats.total_teachers = db.prepare('SELECT COUNT(*) as count FROM teachers WHERE status = ?').get('active').count;
    stats.total_recharges = db.prepare('SELECT COUNT(*) as count FROM recharges').get().count;
    stats.total_hours_sold = db.prepare('SELECT COALESCE(SUM(total_hours), 0) as total FROM recharges').get().total;
    stats.total_hours_consumed = db.prepare('SELECT COALESCE(SUM(hours), 0) as total FROM course_logs').get().total;
    stats.total_remaining = db.prepare('SELECT COALESCE(SUM(remaining_hours), 0) as total FROM students WHERE status = ?').get('active').total;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 课时不足提醒（剩余 <= 1）
router.get('/low-balance', authMiddleware, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.*,
        t.name as teacher_name,
        ct.name as course_type_name
      FROM students s
      LEFT JOIN teachers t ON t.id = s.teacher_id
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE s.remaining_hours <= 1 AND s.status = 'active'
      ORDER BY s.remaining_hours ASC
    `).all();

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;