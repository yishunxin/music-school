const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前用户
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const users = await db.query('SELECT id, username, role FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改密码
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const users = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ error: '原密码错误' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户列表
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await db.query('SELECT id, username, role, created_at FROM users ORDER BY id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建用户
router.post('/users', authMiddleware, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const existing = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role || 'admin']);

    res.json({ id: result.insertId, username, role: role || 'admin' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户
router.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    const users = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    let sql = 'UPDATE users SET username = ?, role = ?';
    let params = [username || user.username, role || user.role];

    if (password) {
      sql += ', password = ?';
      params.push(bcrypt.hashSync(password, 10));
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await db.query(sql, params);
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: '不能删除当前登录账号' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
