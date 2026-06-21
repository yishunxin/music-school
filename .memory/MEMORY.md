# 项目长期记忆

> 本文件记录项目的长期信息，包括技术栈、业务规则、约定等。

## 项目概述

- **项目名称**：琴行课时管理系统
- **类型**：Web 全栈应用（B/S架构）
- **描述**：面向琴行/音乐培训机构的课时管理系统
- **GitHub**：https://github.com/yishunxin/music-school

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + Vite | React 18, Vite |
| 前端样式 | Tailwind CSS | v4 |
| 前端路由 | React Router DOM | v7 |
| 前端图标 | Lucide React | - |
| 前端状态 | React Context | - |
| 前端HTTP | Axios | - |
| 后端框架 | Node.js + Express | - |
| 数据库 | MySQL/MariaDB | >= 8.0 |
| 进程管理 | PM2 | - |
| 反向代理 | Caddy | - |

## 数据库配置

| 环境 | 数据库名 | 端口 |
|------|----------|------|
| 开发 | music_school_dev | 3002 |
| 生产 | music_school | 3001 |

## 核心数据模型

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
| users | 管理员账号 |
| teachers | 教师信息 |
| course_types | 课程类型（乐器+级数） |
| students | 学生信息 |
| recharges | 充值记录（购买/赠送课时） |
| course_logs | 上课签到记录 |
| transactions | 收支记录 |
| teacher_salary | 教师月结工资 |

## 业务规则

1. **学生多课程**：一个学生可同时上多门课，通过充值记录关联
2. **课时计算**：剩余课时 = 充值总课时 - 消耗课时（按课程类型计算）
3. **教师课酬**：每次上课计算教师费用 = 总费用 ÷ 购买课时 ÷ 2
4. **工资月结**：每月汇总教师上课记录生成工资
5. **课时提醒**：剩余课时 ≤ 1 时在首页提醒

## 开发约定

### 命名规范
- 组件文件：PascalCase（如 `UserList.jsx`）
- 工具文件：camelCase（如 `formatDate.js`）
- API 路由：RESTful 风格

### 代码规范
- 使用 ESLint + Prettier
- React 组件优先使用函数式组件 + Hooks
- 后端统一错误处理格式

### Git 规范
- 分支策略：main → develop → feature/bugfix
- 提交格式：`<type>(<scope>): <desc>`

## 环境配置

### 开发环境
- 代码目录：`/var/www/music-school-dev`
- 后端端口：3002
- 前端端口：1234
- 访问地址：http://47.122.126.137:1234

### 生产环境
- 代码目录：`/var/www/music-school`
- 后端端口：3001
- 前端：静态托管
- 访问地址：http://47.122.126.137

## 默认账号

| 环境 | 用户名 | 密码 |
|------|--------|------|
| 开发 | admin | 123456 |
| 生产 | admin | 123456 |

## 重要决策记录

### 2026-05-10 项目文档整理
- 按 dev-workflow 规范重新组织项目文档结构
- 创建 `.memory/`、`docs/`、`logs/` 目录
- 规范文档命名和存放位置

### 2026-05-10 第二版 UI 重构
- **响应式断点**：768px（移动端 <768px，桌面端 ≥768px）
- **移动端**：底部 Tab 导航、卡片式列表布局
- **桌面端**：侧边栏导航、表格展示
- **UI 风格**：蓝色渐变头部、毛玻璃效果统计卡片
- **原型参考**：`ui-design-preview-mobile-v2.0.html` + `ui-design-preview-pc-v2.html`
- 重构页面：Login、Dashboard、Teachers、CourseTypes、Students、Courses、Transactions、Users、MobileMine

---

*最后更新：2026-05-10*
