const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

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
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改密码
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ error: '原密码错误' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户列表
router.get('/users', authMiddleware, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建用户
router.post('/users', authMiddleware, (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hashedPassword, role || 'admin');

    res.json({ id: result.lastInsertRowid, username, role: role || 'admin' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户
router.put('/users/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
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

    db.prepare(sql).run(...params);
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户
router.delete('/users/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: '不能删除当前登录账号' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;