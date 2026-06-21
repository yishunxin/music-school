# 琴行课时管理系统

一款面向琴行/音乐培训机构的课时管理系统，支持学生多课程管理、课时充值签到、教师工资结算等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS |
| 后端 | Node.js + Express + MySQL/MariaDB |
| 数据库 | MySQL / MariaDB |
| 部署 | PM2 + Caddy |
| 云服务器 | 阿里云 ECS (Ubuntu) |

## 功能模块

### 1. 账号管理
- 管理员账号的增删改查
- 密码修改

### 2. 教师管理
- 教师信息维护（姓名、科目、联系电话）
- 可教授课程类型关联

### 3. 课程类型管理
- 课程类型：乐器类型 + 级数
- 例：钢琴(1级)、钢琴(5级)、吉他(入门)、古筝(考级)

### 4. 学生管理
- 学生信息维护（姓名、性别、年龄、联系方式）
- 课时统计（各课程的剩余课时实时计算）

### 5. 课时管理
- **充值**：选择学生、课程类型、授课老师，填写购买/赠送课时
- **签到**：选择学生后选择上哪门课（默认充值最早的课程）
- **退课**：退还未消耗的课时
- **记录查询**：充值记录、上课记录

### 6. 财务管理
- 收支记录分类管理
- 收入/支出统计报表
- 教师月结工资计算

### 7. 工资管理
- 教师月结工资生成
- 按课程类型统计教师收入
- 工资发放状态跟踪

## 数据模型

### 核心关系

```
students (学生)
    ↓
recharges (充值记录) ← teachers (教师)
                    ← course_types (课程类型)
    ↓
course_logs (上课记录)
    ↓
transactions (收支记录)
```

### 数据库表

| 表名 | 说明 |
|------|------|
| `users` | 管理员账号 |
| `teachers` | 教师信息 |
| `course_types` | 课程类型（乐器+级数） |
| `students` | 学生信息 |
| `recharges` | 充值记录（购买/赠送课时） |
| `course_logs` | 上课签到记录 |
| `transactions` | 收支记录 |
| `teacher_salary` | 教师月结工资 |

## 业务规则

1. **学生多课程**：一个学生可同时上多门课，通过充值记录关联
2. **课时计算**：剩余课时 = 充值总课时 - 消耗课时（按课程类型计算）
3. **教师课酬**：每次上课计算教师费用 = 总费用 ÷ 购买课时 ÷ 2
4. **工资月结**：每月汇总教师上课记录生成工资

## 项目结构

```
music-school/
├── .memory/                    # 记忆文件
│   ├── MEMORY.md             # 项目长期记忆
│   └── YYYY-MM-DD.md         # 每日开发日志
│
├── docs/                       # 项目文档
│   ├── requirements/          # 需求文档
│   │   └── SPEC.md           # 需求规格文档
│   ├── design/               # 设计文档
│   │   ├── UI-DESIGN.md     # UI设计规范
│   │   └── PROTOTYPE.md     # 原型说明
│   └── development/          # 开发文档
│       └── API.md           # API文档
│
├── logs/                       # 日志目录
│   ├── error.log             # 错误日志
│   └── debug.log             # 调试日志
│
├── client/                     # 前端 React 应用
│   ├── src/
│   │   ├── api/             # API 接口
│   │   ├── components/      # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── App.jsx         # 主应用
│   │   └── main.jsx        # 入口文件
│   ├── index.html
│   ├── SPEC.md              # (已迁移至 docs/)
│   └── vite.config.js
│
├── server/                     # 后端 Express 应用
│   ├── routes/              # 路由
│   ├── database.js         # 数据库连接
│   └── index.js            # 入口文件
│
├── CHANGELOG.md              # 版本变更记录
├── DEPLOY.md                 # 部署指南
└── README.md                 # 项目说明
```

## 开发环境

| 项目 | 配置 |
|------|------|
| 代码目录 | `/var/www/music-school-dev` |
| 后端端口 | 3002 |
| 前端端口 | 1234 (Vite Dev) |
| 访问地址 | http://47.122.126.137:1234 |
| 数据库 | music_school_dev |

**工作流**：开发环境开发/测试 → 提交 GitHub → 生产环境部署

## 生产环境

| 项目 | 配置 |
|------|------|
| 代码目录 | `/var/www/music-school` |
| 后端端口 | 3001 |
| 前端 | Caddy 静态托管 |
| 访问地址 | http://47.122.126.137 |
| 数据库 | music_school |

**工作流**：生产环境 `git pull` → 重新构建 → PM2 重启

## 部署命令

```bash
# === 开发环境 ===
ssh music-server

# 开发后端重启
pm2 restart music-school-api-dev

# 前端开发服务器
cd /var/www/music-school-dev/client && npm run dev

# 查看开发环境日志
pm2 logs music-school-api-dev

# === 生产环境 ===
ssh music-server

# 拉取最新代码
cd /var/www/music-school && git pull

# 重新构建前端
cd /var/www/music-school/client && npm run build

# 重启生产后端
pm2 restart music-school-api

# 查看生产环境日志
pm2 logs music-school-api
```

## 常用运维

```bash
# 查看 PM2 进程状态
pm2 list

# 查看所有日志
pm2 logs --lines 50

# 数据库备份
mysqldump -u root -p'MusicSchool@2026' music_school > backup_$(date +%Y%m%d).sql

# 查看数据库表
mysql -u root -p'MusicSchool@2026' music_school -e "SHOW TABLES;"
```

## 默认账号

| 环境 | 用户名 | 密码 |
|------|--------|------|
| 开发 | admin | 123456 |
| 生产 | admin | 123456 |

## GitHub

- 仓库：https://github.com/yishunxin/music-school
- 分支：main

---

*最后更新：2026-05-10*
