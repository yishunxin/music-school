const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let db;          // sqlite: Database instance
let pool;        // mysql: pool
let isSqlite = false;
let isMysql = false;

if (DB_TYPE === 'mysql' || DB_TYPE === 'mariadb') {
  isMysql = true;
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'music_school',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
} else {
  isSqlite = true;
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    console.error('❌ better-sqlite3 未安装,执行: npm install better-sqlite3');
    throw err;
  }
  const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../music_school.db');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

function nowSql() {
  return isMysql ? 'NOW()' : "datetime('now', 'localtime')";
}

function intervalSql(months) {
  return isMysql
    ? `DATE_SUB(CURDATE(), INTERVAL ${months} MONTH)`
    : `date('now', '-${months} months')`;
}

function dateFormatSql(column, fmt = '%Y-%m') {
  return isMysql
    ? `DATE_FORMAT(${column}, '${fmt}')`
    : `strftime('${fmt}', ${column})`;
}

async function initDatabase() {
  try {
    if (isSqlite) {
      console.log('✅ SQLite 数据库连接成功:', process.env.DB_PATH || path.join(__dirname, '../../music_school.db'));
      // SQLite schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.exec(`CREATE TABLE IF NOT EXISTS teachers (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT,
          subjects TEXT, hire_date TEXT, memo TEXT, status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS course_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, subject TEXT NOT NULL,
          level INTEGER, hours_unit REAL DEFAULT 1, price REAL NOT NULL, memo TEXT,
          status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, gender TEXT, age INTEGER,
          phone TEXT, guardian_name TEXT, guardian_phone TEXT, memo TEXT,
          status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS recharges (
          id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL,
          course_type_id INTEGER NOT NULL, teacher_id INTEGER NOT NULL,
          buy_hours REAL NOT NULL, gift_hours REAL NOT NULL, total_hours REAL NOT NULL,
          total_fee REAL NOT NULL, unit_point_fee REAL, practice_fee REAL DEFAULT 0,
          recharge_date TEXT NOT NULL, memo TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id),
          FOREIGN KEY (course_type_id) REFERENCES course_types(id),
          FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS course_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL,
          teacher_id INTEGER NOT NULL, course_type_id INTEGER NOT NULL, recharge_id INTEGER,
          hours REAL NOT NULL, unit_fee REAL NOT NULL, total_fee REAL NOT NULL,
          course_date DATETIME NOT NULL, sign_in_date TEXT, memo TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id),
          FOREIGN KEY (teacher_id) REFERENCES teachers(id),
          FOREIGN KEY (course_type_id) REFERENCES course_types(id),
          FOREIGN KEY (recharge_id) REFERENCES recharges(id)
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, amount REAL NOT NULL,
          category TEXT NOT NULL, ref_id INTEGER, ref_type TEXT, description TEXT,
          transaction_date TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.exec(`CREATE TABLE IF NOT EXISTS teacher_salary (
          id INTEGER PRIMARY KEY AUTOINCREMENT, teacher_id INTEGER NOT NULL, month TEXT NOT NULL,
          total_hours REAL NOT NULL, unit_price REAL NOT NULL, total_fee REAL NOT NULL,
          status TEXT DEFAULT 'pending', paid_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )`);

      console.log('✅ 数据库表结构初始化成功');
      const admins = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
      if (!admins) {
        const hashedPassword = bcrypt.hashSync('123456', 10);
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
        console.log('✅ 默认管理员账号已创建: admin / 123456');
      } else {
        console.log('✅ 管理员账号已存在');
      }
    } else {
      // MySQL schema
      const conn = await pool.getConnection();
      console.log('✅ MySQL 数据库连接成功');
      await conn.query(`CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS teachers (
        id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, phone VARCHAR(20),
        subjects TEXT, hire_date DATE, memo TEXT, status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS course_types (
        id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, subject VARCHAR(50) NOT NULL,
        level INT, hours_unit DECIMAL(5,2) DEFAULT 1, price DECIMAL(10,2) NOT NULL, memo TEXT,
        status VARCHAR(20) DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, gender VARCHAR(10),
        age INT, phone VARCHAR(20), guardian_name VARCHAR(100), guardian_phone VARCHAR(20),
        memo TEXT, status VARCHAR(20) DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS recharges (
        id INT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL, course_type_id INT NOT NULL,
        teacher_id INT NOT NULL, buy_hours DECIMAL(10,2) NOT NULL, gift_hours DECIMAL(10,2) NOT NULL,
        total_hours DECIMAL(10,2) NOT NULL, total_fee DECIMAL(10,2) NOT NULL, unit_point_fee DECIMAL(10,2),
        practice_fee DECIMAL(10,2) DEFAULT 0, recharge_date DATE NOT NULL, memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (course_type_id) REFERENCES course_types(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS course_logs (
        id INT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL, teacher_id INT NOT NULL,
        course_type_id INT NOT NULL, recharge_id INT, hours DECIMAL(10,2) NOT NULL,
        unit_fee DECIMAL(10,2) NOT NULL, total_fee DECIMAL(10,2) NOT NULL,
        course_date DATETIME NOT NULL, sign_in_date DATE, memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id),
        FOREIGN KEY (course_type_id) REFERENCES course_types(id),
        FOREIGN KEY (recharge_id) REFERENCES recharges(id)
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT, type VARCHAR(20) NOT NULL, amount DECIMAL(12,2) NOT NULL,
        category VARCHAR(50) NOT NULL, ref_id INT, ref_type VARCHAR(30), description TEXT,
        transaction_date DATE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      await conn.query(`CREATE TABLE IF NOT EXISTS teacher_salary (
        id INT PRIMARY KEY AUTO_INCREMENT, teacher_id INT NOT NULL, month VARCHAR(7) NOT NULL,
        total_hours DECIMAL(10,2) NOT NULL, unit_price DECIMAL(10,2) NOT NULL,
        total_fee DECIMAL(12,2) NOT NULL, status VARCHAR(20) DEFAULT 'pending',
        paid_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )`);

      console.log('✅ 数据库表结构初始化成功');
      const [admins] = await conn.query('SELECT * FROM users WHERE username = ?', ['admin']);
      if (admins.length === 0) {
        const hashedPassword = bcrypt.hashSync('123456', 10);
        await conn.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
        console.log('✅ 默认管理员账号已创建: admin / 123456');
      } else {
        console.log('✅ 管理员账号已存在');
      }
      conn.release();
    }
    return true;
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message);
    throw err;
  }
}

// ============ 统一查询接口 ============
const query = async (sql, params = []) => {
  try {
    if (isSqlite) {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT')) {
        return db.prepare(sql).all(params);
      } else {
        const info = db.prepare(sql).run(params);
        return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }];
      }
    } else {
      const [rows] = await pool.query(sql, params);
      return rows;
    }
  } catch (err) {
    console.error('SQL Error:', sql, err.message);
    throw err;
  }
};

const get = async (sql, params = []) => {
  if (isSqlite) return db.prepare(sql).get(params);
  const [rows] = await pool.query(sql, params);
  return rows[0];
};

const all = async (sql, params = []) => {
  if (isSqlite) return db.prepare(sql).all(params);
  const [rows] = await pool.query(sql, params);
  return rows;
};

const run = async (sql, params = []) => {
  if (isSqlite) {
    const info = db.prepare(sql).run(params);
    return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
  }
  const [result] = await pool.query(sql, params);
  return { lastInsertRowid: result.insertId, changes: result.affectedRows };
};

const getConnection = async () => {
  if (isSqlite) {
    // SQLite is synchronous; return a shim with .query() and .release()
    return {
      query: async (sql, params) => {
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT')) {
          return [db.prepare(sql).all(params || [])];
        } else {
          const info = db.prepare(sql).run(params || []);
          return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }];
        }
      },
      release: () => {},
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
    };
  }
  return pool.getConnection();
};

module.exports = {
  db,
  pool,
  query,
  get,
  all,
  run,
  getConnection,
  initDatabase,
  nowSql,
  intervalSql,
  dateFormatSql,
  isSqlite: () => isSqlite,
  isMysql: () => isMysql,
};
