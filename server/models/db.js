const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'music_school',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let db;

async function initDatabase() {
  try {
    // 创建数据库连接测试
    db = await pool.getConnection();
    console.log('✅ MySQL 数据库连接成功');

    // 初始化表结构
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        subjects TEXT,
        hire_date DATE,
        memo TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS course_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        subject VARCHAR(50) NOT NULL,
        level INT,
        hours_unit DECIMAL(5,2) DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        memo TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        gender VARCHAR(10),
        age INT,
        phone VARCHAR(20),
        guardian_name VARCHAR(100),
        guardian_phone VARCHAR(20),
        teacher_id INT NOT NULL,
        course_type_id INT NOT NULL,
        remaining_hours DECIMAL(10,2) DEFAULT 0,
        memo TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id),
        FOREIGN KEY (course_type_id) REFERENCES course_types(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS recharges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        course_type_id INT NOT NULL,
        teacher_id INT NOT NULL,
        buy_hours DECIMAL(10,2) NOT NULL,
        gift_hours DECIMAL(10,2) NOT NULL,
        total_hours DECIMAL(10,2) NOT NULL,
        total_fee DECIMAL(10,2) NOT NULL,
        unit_point_fee DECIMAL(10,2),
        recharge_date DATE NOT NULL,
        memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (course_type_id) REFERENCES course_types(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS course_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        teacher_id INT NOT NULL,
        course_type_id INT NOT NULL,
        hours DECIMAL(10,2) NOT NULL,
        unit_fee DECIMAL(10,2) NOT NULL,
        total_fee DECIMAL(10,2) NOT NULL,
        course_date DATETIME NOT NULL,
        recharge_id INT,
        memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id),
        FOREIGN KEY (course_type_id) REFERENCES course_types(id),
        FOREIGN KEY (recharge_id) REFERENCES recharges(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        ref_id INT,
        ref_type VARCHAR(30),
        description TEXT,
        transaction_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS teacher_salary (
        id INT PRIMARY KEY AUTO_INCREMENT,
        teacher_id INT NOT NULL,
        month VARCHAR(7) NOT NULL,
        total_hours DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_fee DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )
    `);

    console.log('✅ 数据库表结构初始化成功');

    // 检查是否有管理员账号
    const [admins] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (admins.length === 0) {
      const hashedPassword = bcrypt.hashSync('123456', 10);
      await db.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
      console.log('✅ 默认管理员账号已创建: admin / 123456');
    } else {
      console.log('✅ 管理员账号已存在');
    }

    db.release();
    return true;
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message);
    throw err;
  }
}

// 封装常用的数据库操作
const query = async (sql, params) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    connection.release();
  }
};

const getConnection = () => pool.getConnection();

module.exports = {
  pool,
  query,
  getConnection,
  initDatabase
};
