const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teachers');
const courseTypeRoutes = require('./routes/courseTypes');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const transactionRoutes = require('./routes/transactions');

app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/course-types', courseTypeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/transactions', transactionRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库后启动服务器
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🎹 琴行管理系统后端已启动 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ 服务器启动失败:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
