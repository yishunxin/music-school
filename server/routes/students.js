const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取学生列表
router.get('/', authMiddleware, async (req, res) => {
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

    const students = await db.query(sql, params);
    res.json(students);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: '获取学生列表失败：' + (err.message || '未知错误') });
  }
});

// 获取单个学生
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const students = await db.query(`
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
    `, [req.params.id]);
    const student = students[0];

    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 获取该学生的充值记录
    const recharges = await db.query(`
      SELECT r.*, ct.name as course_type_name
      FROM recharges r
      LEFT JOIN course_types ct ON ct.id = r.course_type_id
      WHERE r.student_id = ?
      ORDER BY r.recharge_date DESC
    `, [req.params.id]);

    // 获取该学生的上课记录
    const courseLogs = await db.query(`
      SELECT cl.*, t.name as teacher_name, ct.name as course_type_name
      FROM course_logs cl
      LEFT JOIN teachers t ON t.id = cl.teacher_id
      LEFT JOIN course_types ct ON ct.id = cl.course_type_id
      WHERE cl.student_id = ?
      ORDER BY cl.course_date DESC
    `, [req.params.id]);

    res.json({ ...student, recharges, courseLogs });
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ error: '获取学生详情失败：' + (err.message || '未知错误') });
  }
});

// 创建学生
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo } = req.body;

    if (!name || !teacher_id || !course_type_id) {
      return res.status(400).json({ error: '请填写完整信息（姓名、授课老师、课程类型必填）' });
    }

    // 验证教师存在
    const teachers = await db.query('SELECT * FROM teachers WHERE id = ? AND status = ?', [teacher_id, 'active']);
    const teacher = teachers[0];
    if (!teacher) {
      return res.status(400).json({ error: '教师不存在或已停用' });
    }

    // 验证课程类型存在
    const courseTypes = await db.query('SELECT * FROM course_types WHERE id = ? AND status = ?', [course_type_id, 'active']);
    const courseType = courseTypes[0];
    if (!courseType) {
      return res.status(400).json({ error: '课程类型不存在或已停用' });
    }

    const result = await db.query(`
      INSERT INTO students (name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo]);

    res.json({ id: result.insertId, message: '创建成功' });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: '创建学生失败：' + (err.message || '未知错误') });
  }
});

// 更新学生
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo, status } = req.body;

    const students = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    const student = students[0];
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 如果更换了教师或课程类型，验证新值
    if (teacher_id) {
      const teachers = await db.query('SELECT * FROM teachers WHERE id = ? AND status = ?', [teacher_id, 'active']);
      if (!teachers[0]) {
        return res.status(400).json({ error: '教师不存在或已停用' });
      }
    }

    if (course_type_id) {
      const courseTypes = await db.query('SELECT * FROM course_types WHERE id = ? AND status = ?', [course_type_id, 'active']);
      if (!courseTypes[0]) {
        return res.status(400).json({ error: '课程类型不存在或已停用' });
      }
    }

    await db.query(`
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
    `, [name, gender, age, phone, guardian_name, guardian_phone, teacher_id, course_type_id, memo, status, req.params.id]);

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: '更新学生失败：' + (err.message || '未知错误') });
  }
});

// 删除学生 - 需要验证密码
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: '请输入登录密码进行验证' });
    }

    // 验证当前用户密码
    const users = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '密码验证失败' });
    }

    // 检查是否有充值记录
    const rechargeCount = await db.query('SELECT COUNT(*) as count FROM recharges WHERE student_id = ?', [req.params.id]);
    if (rechargeCount[0].count > 0) {
      return res.status(400).json({ error: '该学生有充值记录，无法删除' });
    }

    await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: '删除学生失败：' + (err.message || '未知错误') });
  }
});

module.exports = router;
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 检查是否有充值记录
    const rechargeCount = await db.query('SELECT COUNT(*) as count FROM recharges WHERE student_id = ?', [req.params.id]);
    if (rechargeCount[0].count > 0) {
      return res.status(400).json({ error: '该学生有充值记录，无法删除' });
    }

    await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
