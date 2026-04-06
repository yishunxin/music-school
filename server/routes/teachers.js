const express = require('express');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取教师列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT t.*,
        COUNT(DISTINCT s.id) as student_count,
        COUNT(DISTINCT ct.id) as course_type_count
      FROM teachers t
      LEFT JOIN students s ON s.teacher_id = t.id AND s.status = 'active'
      LEFT JOIN course_types ct ON ct.id IN (
        SELECT course_type_id FROM students WHERE teacher_id = t.id AND status = 'active'
      )
    `;

    const params = [];
    if (status) {
      sql += ' WHERE t.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY t.id ORDER BY t.created_at DESC';

    const teachers = await db.query(sql, params);
    res.json(teachers);
  } catch (err) {
    console.error('Get teachers error:', err);
    res.status(500).json({ error: '获取教师列表失败：' + (err.message || '未知错误') });
  }
});

// 获取单个教师
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const teachers = await db.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
    const teacher = teachers[0];
    if (!teacher) {
      return res.status(404).json({ error: '教师不存在' });
    }

    // 获取该教师的学生列表
    const students = await db.query(`
      SELECT s.*, ct.name as course_type_name
      FROM students s
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE s.teacher_id = ? AND s.status = 'active'
    `, [req.params.id]);

    // 获取该教师能教授的课程类型
    const courseTypes = await db.query(`
      SELECT DISTINCT ct.*
      FROM course_types ct
      INNER JOIN students s ON s.course_type_id = ct.id
      WHERE s.teacher_id = ? AND ct.status = 'active'
    `, [req.params.id]);

    res.json({ ...teacher, students, courseTypes });
  } catch (err) {
    res.status(500).json({ error: '获取教师详情失败：' + (err.message || '未知错误') });
  }
});

// 创建教师
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, subjects, hire_date, memo } = req.body;

    if (!name) {
      return res.status(400).json({ error: '请填写教师姓名' });
    }

    const subjectsJson = subjects ? JSON.stringify(subjects) : null;
    const hireDate = hire_date || null;
    const result = await db.query(`
      INSERT INTO teachers (name, phone, subjects, hire_date, memo)
      VALUES (?, ?, ?, ?, ?)
    `, [name, phone, subjectsJson, hireDate, memo]);

    res.json({ id: result.insertId, message: '创建成功' });
  } catch (err) {
    console.error('Create teacher error:', err);
    res.status(500).json({ error: '创建教师失败：' + (err.message || '未知错误') });
  }
});

// 更新教师
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, subjects, hire_date, memo, status } = req.body;

    const teachers = await db.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
    const teacher = teachers[0];
    if (!teacher) {
      return res.status(404).json({ error: '教师不存在' });
    }

    const subjectsJson = subjects ? JSON.stringify(subjects) : undefined;
    await db.query(`
      UPDATE teachers SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        subjects = COALESCE(?, subjects),
        hire_date = COALESCE(?, hire_date),
        memo = COALESCE(?, memo),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [name, phone, subjectsJson, hire_date, memo, status, req.params.id]);

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('Update teacher error:', err);
    res.status(500).json({ error: '更新教师失败：' + (err.message || '未知错误') });
  }
});

// 删除教师
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 检查是否有学生关联
    const studentCount = await db.query('SELECT COUNT(*) as count FROM students WHERE teacher_id = ? AND status = ?', [req.params.id, 'active']);
    if (studentCount[0].count > 0) {
      return res.status(400).json({ error: '该教师有学生关联，无法删除' });
    }

    await db.query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('Delete teacher error:', err);
    res.status(500).json({ error: '删除教师失败：' + (err.message || '未知错误') });
  }
});

module.exports = router;
