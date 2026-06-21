const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../music_school.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  try {
    console.log('✅ SQLite 数据库连接成功:', DB_PATH);

    // 创建表结构 (SQLite 语法)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        subjects TEXT,
        hire_date TEXT,
        memo TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
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
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        phone TEXT,
        guardian_name TEXT,
        guardian_phone TEXT,
        memo TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
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
        practice_fee REAL DEFAULT 0,
        recharge_date TEXT NOT NULL,
        memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (course_type_id) REFERENCES course_types(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS course_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        course_type_id INTEGER NOT NULL,
        recharge_id INTEGER,
        hours REAL NOT NULL,
        unit_fee REAL NOT NULL,
        total_fee REAL NOT NULL,
        course_date DATETIME NOT NULL,
        sign_in_date TEXT,
        memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id),
        FOREIGN KEY (course_type_id) REFERENCES course_types(id),
        FOREIGN KEY (recharge_id) REFERENCES recharges(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        ref_id INTEGER,
        ref_type TEXT,
        description TEXT,
        transaction_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
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
      )
    `);

    console.log('✅ 数据库表结构初始化成功');

    // 检查是否有管理员账号
    const admins = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!admins) {
      const hashedPassword = bcrypt.hashSync('123456', 10);
      db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
      console.log('✅ 默认管理员账号已创建: admin / 123456');
    } else {
      console.log('✅ 管理员账号已存在');
    }

    return true;
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message);
    throw err;
  }
}

// 封装常用的数据库操作
const query = (sql, params = []) => {
  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return db.prepare(sql).all(params);
    } else {
      const info = db.prepare(sql).run(params);
      return { insertId: info.lastInsertRowid, changes: info.changes };
    }
  } catch (err) {
    console.error('SQL Error:', sql, err.message);
    throw err;
  }
};

const get = (sql, params = []) => {
  return db.prepare(sql).get(params);
};

const all = (sql, params = []) => {
  return db.prepare(sql).all(params);
};

const run = (sql, params = []) => {
  return db.prepare(sql).run(params);
};

module.exports = {
  db,
  query,
  get,
  all,
  run,
  initDatabase,
};
