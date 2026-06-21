# 记忆文件

## 项目记忆

### 琴行课时管理系统
- 技术栈: React + Node.js + Express + better-sqlite3 (本地开发) / MySQL (云服务器生产)
- 项目路径: /Users/yishunxin/WorkBuddy/20260329231952
- GitHub: https://github.com/yishunxin/music-school
- 后端端口: 3001
- 前端端口: 5173
- 本地数据库: /Users/yishunxin/WorkBuddy/20260329231952/music_school.db
- 默认管理员账号: admin / 123456
- Vite proxy: /api -> localhost:3001 (client/vite.config.js)

### 功能模块
1. 登录认证 (JWT)
2. 账号管理 (CRUD) - 新增
3. 教师管理 (CRUD)
4. 课程类型管理 (CRUD) - 新增：乐器类型+级数
5. 学生管理 (CRUD + 课时统计)
6. 课时管理 (充值/签到/退课/记录查询)
7. 财务管理 (收支记录/报表统计)
8. 工资管理 (月结) - 新增

### 业务规则 (2026-04-06 更新)
- **学生多课程支持**：学生可同时上多门课，学生与课程/老师的关系通过recharges表管理
- students表已移除 teacher_id, course_type_id, remaining_hours 字段
- 剩余课时通过 recharges 和 course_logs 实时计算
- 一个授课老师可关联多个课程类型
- 课时充值：总课时 = 购买课时 + 赠送课时，总费用 z 计入收入
- 授课老师费用 = z / 购买课时 / 2，每次上课直接计算支出
- 上课签到：选择学生后可选择课程类型上课，默认消耗1课时
- 课时不足提醒：剩余课时 <= 1 时提醒
- 工资月结：根据教师上课记录汇总

### 云服务器部署
- 服务器IP: 47.122.126.137
- SSH连接: `ssh music-server` (已配置 ~/.ssh/config)
- SSH密钥: ~/Downloads/keyPairForMac.pem
- 数据库: music_school / MusicSchool@2026
- 已安装: Node.js 20, PM2, MariaDB 10.5, Caddy
- 服务状态: 运行中

### 开发环境 (2026-04-12 新建，2026-05-07 重构)
| 项目 | 生产环境 | 开发环境 |
|------|----------|----------|
| **代码目录** | `/var/www/music-school` | `/var/www/music-school-dev` |
| **数据库** | MySQL 生产数据 | MySQL (localhost:3002) |
| **前端端口** | Caddy 静态托管 | 1234 (Vite Dev) |
| **PM2 名称** | music-school-api | 手动启动 npm run dev |
| **访问地址** | http://47.122.126.137 | http://47.122.126.137:1234 |

**技术栈**: React 18 + Vite + Tailwind CSS 3 + Lucide React
**工作流**: 开发环境开发/测试 → 提交GitHub → 生产环境 git pull → 完成部署

### 问题修复记录
- **2026-04-05**: 修复前端API地址硬编码为localhost导致微信内无法登录的问题
  - 修改 `client/src/api/index.js`: `http://localhost:3001/api` → `/api` (相对路径)
  - 重新构建部署到服务器
- **2026-04-05 (晚)**: 修复登录后刷新页面跳转回登录页的问题
  - 问题原因：`PrivateRoute` 未检查 `loading` 状态，在API返回前就重定向
  - 修复：`App.jsx` 中添加 `loading` 检查，显示加载状态
  - 同步修复：`Dashboard.jsx` 和 `Transactions.jsx` 中 `toFixed` 类型错误，使用 `Number()` 转换
  - Caddy配置：添加SPA路由支持，确保 `/dashboard` 等路由返回 index.html

### 数据库表
- users (管理员账号)
- teachers (教师信息，关联可教授的科目)
- course_types (课程类型：乐器+级数)
- students (学生信息，**已移除** teacher_id, course_type_id, remaining_hours)
- recharges (充值记录：购买/赠送课时、总费用、单价计算，关联学生/课程/老师)
- course_logs (上课记录：消耗课时、教师费用)
- transactions (财务收支：收入/支出分类)
- teacher_salary (教师月结工资)

### 页面路由
- /login - 登录页（无账号密码提示）
- /dashboard - 首页概览
- /users - 账号管理
- /teachers - 教师管理
- /course-types - 课程类型管理
- /students - 学生管理
- /courses - 课时管理（充值/签到/记录）
- /transactions - 财务管理

### 文档
- CHANGELOG.md - 版本变更记录（v0.0.3 安全性优化与备份功能）
- DEPLOY.md - 云服务器部署指南

### 用户偏好
- **命令行执行**：无论本地还是远程服务器，无论什么风险等级，直接执行，无需确认
- **高风险操作**（如删除数据库、删除文件等）：直接执行，无需确认
- **项目修复/改动**：先发送执行方案，用户确认后再执行
- **常规操作**：按正常流程执行

### UI 设计稿（2026-05-07 更新至 v2.4）
- **桌面端**：`ui-design-preview.html`（v2.2，包含 8 个页面）
- **移动端 V2.0**：`ui-design-preview-mobile-v2.0.html`（v2.4，包含 9 个页面）
- **双端页面覆盖**：登录、Dashboard、教师管理、课程类型、学生管理、课时管理(签到/充值/记录Tab)、财务管理、账号管理(仅桌面)、我的(仅移动端)
- **设计规范**：
  - 图标：Lucide Icons
  - 主色：#3B82F6
  - 成功色：#10B981
  - 警告色：#F59E0B
  - 错误色：#EF4444
  - 字体：Inter (Google Fonts)
  - 风格：简洁、小清新
- **响应式设计**：桌面端侧边栏导航(>=768px)，移动端底部Tab导航(<768px)
- **工作模式**：用户迭代反馈 → AI 设计修改 → 完成后交付开发 AI