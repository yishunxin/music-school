# 记忆文件

## 项目记忆

### 琴行课时管理系统
- 技术栈: React + Node.js + Express + MySQL (原 SQLite)
- 项目路径: /Users/yishunxin/WorkBuddy/20260329231952
- GitHub: https://github.com/yishunxin/music-school
- 后端端口: 3001
- 前端端口: 5173
- 默认管理员账号: admin / 123456

### 功能模块
1. 登录认证 (JWT)
2. 账号管理 (CRUD) - 新增
3. 教师管理 (CRUD)
4. 课程类型管理 (CRUD) - 新增：乐器类型+级数
5. 学生管理 (CRUD + 课时统计)
6. 课时管理 (充值/签到/退课/记录查询)
7. 财务管理 (收支记录/报表统计)
8. 工资管理 (月结) - 新增

### 业务规则
- 一个学生同一时间只能有一个授课老师，只能有一种课程类型
- 一个授课老师可关联多个课程类型
- 课时充值：总课时 = 购买课时 + 赠送课时，总费用 z 计入收入
- 授课老师费用 = z / 购买课时 / 2，每次上课直接计算支出
- 上课签到：选学生后自动关联老师和课程类型，默认消耗1课时
- 课时不足提醒：剩余课时 <= 1 时提醒
- 工资月结：根据教师上课记录汇总

### 云服务器部署
- 服务器IP: 47.122.126.137
- SSH密钥: ~/Downloads/keyPairForMac.pem
- 数据库: music_school / MusicSchool@2026
- 已安装: Node.js 20, PM2, MariaDB 10.5, Caddy
- 服务状态: 运行中

### 数据库表
- users (管理员账号)
- teachers (教师信息，关联可教授的科目)
- course_types (课程类型：乐器+级数)
- students (学生信息，关联授课老师和课程类型)
- recharges (充值记录：购买/赠送课时、总费用、单价计算)
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
- CHANGELOG.md - 版本变更记录（v0.0.1 初始版本, v0.0.2 MySQL迁移）
- DEPLOY.md - 云服务器部署指南