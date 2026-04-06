const express = require('express');
const db = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取课程类型列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM course_types';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY subject, level';

    const courseTypes = await db.query(sql, params);
    res.json(courseTypes);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个课程类型
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const courseTypes = await db.query('SELECT * FROM course_types WHERE id = ?', [req.params.id]);
    const courseType = courseTypes[0];
    if (!courseType) {
      return res.status(404).json({ error: '课程类型不存在' });
    }
    res.json(courseType);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建课程类型
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, subject, level, hours_unit, price, memo } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const result = await db.query(`
      INSERT INTO course_types (name, subject, level, hours_unit, price, memo)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, subject, level || 1, hours_unit || 1, price || null, memo]);

    res.json({ id: result.insertId, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新课程类型
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, subject, level, hours_unit, price, memo, status } = req.body;

    const courseTypes = await db.query('SELECT * FROM course_types WHERE id = ?', [req.params.id]);
    const courseType = courseTypes[0];
    if (!courseType) {
      return res.status(404).json({ error: '课程类型不存在' });
    }

    await db.query(`
      UPDATE course_types SET
        name = COALESCE(?, name),
        subject = COALESCE(?, subject),
        level = COALESCE(?, level),
        hours_unit = COALESCE(?, hours_unit),
        price = COALESCE(?, price),
        memo = COALESCE(?, memo),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [name, subject, level, hours_unit, price, memo, status, req.params.id]);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除课程类型
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 检查是否有学生关联
    const studentCount = await db.query('SELECT COUNT(*) as count FROM students WHERE course_type_id = ? AND status = ?', [req.params.id, 'active']);
    if (studentCount[0].count > 0) {
      return res.status(400).json({ error: '该课程类型有学生关联，无法删除' });
    }

    await db.query('DELETE FROM course_types WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
