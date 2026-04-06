const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取学生列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, status } = req.query;

    let sql = `SELECT * FROM students WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR guardian_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const students = await db.query(sql, params);

    // 获取每个学生的课程汇总信息（剩余课时 > 0 的课程）
    for (let student of students) {
      const coursesInfo = await getStudentCoursesInfo(student.id);
      student.courses_summary = coursesInfo;
    }

    res.json(students);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: '获取学生列表失败：' + (err.message || '未知错误') });
  }
});

// 获取学生各课程剩余课时（内部函数）
async function getStudentCoursesInfo(studentId) {
  try {
    const sql = `
      SELECT
        r.course_type_id,
        ct.name as course_type_name,
        r.teacher_id,
        t.name as teacher_name,
        r.total_hours - COALESCE(cl.consumed, 0) as remaining_hours,
        r.min_recharge_date as first_recharge_date
      FROM (
        SELECT
          course_type_id,
          teacher_id,
          SUM(total_hours) as total_hours,
          MIN(recharge_date) as min_recharge_date
        FROM recharges
        WHERE student_id = ?
        GROUP BY course_type_id, teacher_id
      ) r
      LEFT JOIN course_types ct ON ct.id = r.course_type_id
      LEFT JOIN teachers t ON t.id = r.teacher_id
      LEFT JOIN (
        SELECT course_type_id, SUM(hours) as consumed
        FROM course_logs
        WHERE student_id = ?
        GROUP BY course_type_id
      ) cl ON cl.course_type_id = r.course_type_id
      WHERE r.total_hours - COALESCE(cl.consumed, 0) > 0
      ORDER BY r.min_recharge_date ASC
    `;

    const courses = await db.query(sql, [studentId, studentId]);
    return courses;
  } catch (err) {
    console.error('Get student courses info error:', err);
    return [];
  }
}

// 获取单个学生
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const students = await db.query(`
      SELECT * FROM students WHERE id = ?
    `, [req.params.id]);
    const student = students[0];

    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 获取该学生的充值记录
    const recharges = await db.query(`
      SELECT r.*, ct.name as course_type_name, t.name as teacher_name
      FROM recharges r
      LEFT JOIN course_types ct ON ct.id = r.course_type_id
      LEFT JOIN teachers t ON t.id = r.teacher_id
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

    // 获取课程汇总
    const coursesInfo = await getStudentCoursesInfo(req.params.id);

    res.json({ ...student, recharges, courseLogs, courses: coursesInfo });
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ error: '获取学生详情失败：' + (err.message || '未知错误') });
  }
});

// 获取学生的课程列表（剩余课时 > 0）
router.get('/:id/courses', authMiddleware, async (req, res) => {
  try {
    const students = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!students[0]) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const courses = await getStudentCoursesInfo(req.params.id);

    res.json({
      student_id: parseInt(req.params.id),
      student_name: students[0].name,
      courses
    });
  } catch (err) {
    console.error('Get student courses error:', err);
    res.status(500).json({ error: '获取学生课程失败：' + (err.message || '未知错误') });
  }
});

// 创建学生
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, gender, age, phone, guardian_name, guardian_phone, memo } = req.body;

    if (!name) {
      return res.status(400).json({ error: '请填写学生姓名' });
    }

    const result = await db.query(`
      INSERT INTO students (name, gender, age, phone, guardian_name, guardian_phone, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, gender, age, phone, guardian_name, guardian_phone, memo]);

    res.json({ id: result.insertId, message: '创建成功' });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: '创建学生失败：' + (err.message || '未知错误') });
  }
});

// 更新学生
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, gender, age, phone, guardian_name, guardian_phone, memo, status } = req.body;

    const students = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    const student = students[0];
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    await db.query(`
      UPDATE students SET
        name = COALESCE(?, name),
        gender = COALESCE(?, gender),
        age = COALESCE(?, age),
        phone = COALESCE(?, phone),
        guardian_name = COALESCE(?, guardian_name),
        guardian_phone = COALESCE(?, guardian_phone),
        memo = COALESCE(?, memo),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [name, gender, age, phone, guardian_name, guardian_phone, memo, status, req.params.id]);

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
