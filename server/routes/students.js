const express = require('express');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取学生列表
router.get('/', authMiddleware, (req, res) => {
  try {
    const { search, teacher_id, status } = req.query;

    let sql = `
      SELECT s.*,
        t.name as teacher_name,
        ct.name as course_type_name,
        ct.subject,
        ct.level
      FROM students s
      LEFT JOIN teachers t ON t.id = s.teacher_id
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += ' AND (s.name LIKE ? OR s.phone LIKE ? OR s.guardian_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (teacher_id) {
      sql += ' AND s.teacher_id = ?';
      params.push(teacher_id);
    }

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.created_at DESC';

    const students = db.prepare(sql).all(...params);
    res.json(students);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个学生
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const student = db.prepare(`
      SELECT s.*,
        t.name as teacher_name,
        ct.name as course_type_name,
        ct.subject,
        ct.level,
        ct.price as unit_price
      FROM students s
      LEFT JOIN teachers t ON t.id = s.teacher_id
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 获取该学生的充值记录
    const recharges = db.prepare(`
      SELECT r.*, ct.name as course_type_name
      FROM recharges r
      LEFT JOIN course_types ct ON ct.id = r.course_type_id
      WHERE r.student_id = ?
      ORDER BY r.recharge_date DESC
    `).all(req.params.id);

    // 获取该学生的上课记录
    const courseLogs = db.prepare(`
      SELECT cl.*, t.name as teacher_name, ct.name as course_type_name
      FROM course_logs cl
      LEFT JOIN teachers t ON t.id = cl.teacher_id
      LEFT JOIN course_types ct ON ct.id = cl.course_type_id
      WHERE cl.student_id = ?
      ORDER BY cl.course_date DESC
    `).all(req.params.id);

    res.json({ ...student, recharges, courseLogs });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建学生
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo } = req.body;

    if (!name || !teacher_id || !course_type_id) {
      return res.status(400).json({ error: '请填写完整信息（姓名、授课老师、课程类型必填）' });
    }

    // 验证教师存在
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ? AND status = ?').get(teacher_id, 'active');
    if (!teacher) {
      return res.status(400).json({ error: '教师不存在或已停用' });
    }

    // 验证课程类型存在
    const courseType = db.prepare('SELECT * FROM course_types WHERE id = ? AND status = ?').get(course_type_id, 'active');
    if (!courseType) {
      return res.status(400).json({ error: '课程类型不存在或已停用' });
    }

    const result = db.prepare(`
      INSERT INTO students (name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo);

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新学生
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo, status } = req.body;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 如果更换了教师或课程类型，验证新值
    if (teacher_id) {
      const teacher = db.prepare('SELECT * FROM teachers WHERE id = ? AND status = ?').get(teacher_id, 'active');
      if (!teacher) {
        return res.status(400).json({ error: '教师不存在或已停用' });
      }
    }

    if (course_type_id) {
      const courseType = db.prepare('SELECT * FROM course_types WHERE id = ? AND status = ?').get(course_type_id, 'active');
      if (!courseType) {
        return res.status(400).json({ error: '课程类型不存在或已停用' });
      }
    }

    db.prepare(`
      UPDATE students SET
        name = COALESCE(?, name),
        gender = COALESCE(?, gender),
        age = COALESCE(?, age),
        phone = COALESCE(?, phone),
        guardian_name = COALESCE(?, guardian_name),
        guardian_phone = COALESCE(?, guardian_phone),
        teacher_id = COALESCE(?, teacher_id),
        course_type_id = COALESCE(?, course_type_id),
        memo = COALESCE(?, memo),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo, status, req.params.id);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除学生
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    // 检查是否有充值记录
    const rechargeCount = db.prepare('SELECT COUNT(*) as count FROM recharges WHERE student_id = ?').get(req.params.id);
    if (rechargeCount.count > 0) {
      return res.status(400).json({ error: '该学生有充值记录，无法删除' });
    }

    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;