const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 初始化数据库表结构
const initSQL = `
-- 用户表（管理员）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教师表
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  subjects TEXT,
  hire_date DATE,
  memo TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 课程类型表 (乐器类型+级数)
CREATE TABLE IF NOT EXISTS course_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  level INTEGER,
  hours_unit REAL DEFAULT 1,
  price REAL NOT NULL,
  memo TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学生表
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT,
  age INTEGER,
  phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  teacher_id INTEGER NOT NULL,
  course_type_id INTEGER NOT NULL,
  remaining_hours REAL DEFAULT 0,
  memo TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (course_type_id) REFERENCES course_types(id)
);

-- 课时充值记录表
CREATE TABLE IF NOT EXISTS recharges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_type_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  buy_hours REAL NOT NULL,
  gift_hours REAL NOT NULL,
  total_hours REAL NOT NULL,
  total_fee REAL NOT NULL,
  unit_point_fee REAL,
  recharge_date DATE NOT NULL,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_type_id) REFERENCES course_types(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 课时消费记录表(上课签到)
CREATE TABLE IF NOT EXISTS course_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  course_type_id INTEGER NOT NULL,
  hours REAL NOT NULL,
  unit_fee REAL NOT NULL,
  total_fee REAL NOT NULL,
  course_date DATETIME NOT NULL,
  recharge_id INTEGER,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (course_type_id) REFERENCES course_types(id),
  FOREIGN KEY (recharge_id) REFERENCES recharges(id)
);

-- 财务收支记录表
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  ref_id INTEGER,
  ref_type TEXT,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教师工资表(月结)
CREATE TABLE IF NOT EXISTS teacher_salary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  total_hours REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_fee REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);
`;

try {
  db.exec(initSQL);
  console.log('✅ 数据库初始化成功');

  // 检查是否有管理员账号
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
    console.log('✅ 默认管理员账号已创建: admin / 123456');
  } else {
    console.log('✅ 管理员账号已存在');
  }
} catch (err) {
  console.error('❌ 数据库初始化失败:', err.message);
}

module.exports = db;