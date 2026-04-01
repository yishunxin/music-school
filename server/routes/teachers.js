const express = require('express');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取教师列表
router.get('/', authMiddleware, (req, res) => {
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

    const teachers = db.prepare(sql).all(...params);
    res.json(teachers);
  } catch (err) {
    console.error('Get teachers error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个教师
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: '教师不存在' });
    }

    // 获取该教师的学生列表
    const students = db.prepare(`
      SELECT s.*, ct.name as course_type_name
      FROM students s
      LEFT JOIN course_types ct ON ct.id = s.course_type_id
      WHERE s.teacher_id = ? AND s.status = 'active'
    `).all(req.params.id);

    // 获取该教师能教授的课程类型
    const courseTypes = db.prepare(`
      SELECT DISTINCT ct.*
      FROM course_types ct
      INNER JOIN students s ON s.course_type_id = ct.id
      WHERE s.teacher_id = ? AND ct.status = 'active'
    `).all(req.params.id);

    res.json({ ...teacher, students, courseTypes });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建教师
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, phone, subjects, hire_date, memo } = req.body;

    if (!name) {
      return res.status(400).json({ error: '请填写教师姓名' });
    }

    const subjectsJson = subjects ? JSON.stringify(subjects) : null;
    const result = db.prepare(`
      INSERT INTO teachers (name, phone, subjects, hire_date, memo)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, phone, subjectsJson, hire_date, memo);

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新教师
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, phone, subjects, hire_date, memo, status } = req.body;

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: '教师不存在' });
    }

    const subjectsJson = subjects ? JSON.stringify(subjects) : undefined;
    db.prepare(`
      UPDATE teachers SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        subjects = COALESCE(?, subjects),
        hire_date = COALESCE(?, hire_date),
        memo = COALESCE(?, memo),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(name, phone, subjectsJson, hire_date, memo, status, req.params.id);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除教师
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    // 检查是否有学生关联
    const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE teacher_id = ? AND status = ?').get(req.params.id, 'active');
    if (studentCount.count > 0) {
      return res.status(400).json({ error: '该教师有学生关联，无法删除' });
    }

    db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;