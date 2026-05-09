# 琴行管理系统 - UI 设计规范 v2.0

## 1. 技术栈

- **框架**: React 18 + Vite
- **样式**: Tailwind CSS 4
- **图标**: Lucide React
- **路由**: React Router DOM v7
- **状态**: React Context
- **HTTP**: Axios

## 2. 设计规范

### 2.1 色彩系统

| 用途 | 色值 |
|------|------|
| 主色 | #3B82F6 |
| 主色深 | #2563EB |
| 成功色 | #10B981 |
| 警告色 | #F59E0B |
| 错误色 | #EF4444 |
| 背景色 | #F9FAFB |
| 卡片色 | #FFFFFF |
| 侧边栏 | #1F2937 |
| 侧边栏激活 | #374151 |

### 2.2 字体

- 主字体: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- 字重: 300(轻), 400(正常), 500(中等), 600(半粗), 700(粗)

### 2.3 响应式断点

| 端 | 断点 | 说明 |
|----|------|------|
| 桌面端 | >=768px | 侧边栏导航 |
| 移动端 | <768px | 底部Tab导航 |

## 3. 页面结构

### 3.1 桌面端
- 左侧固定侧边栏 (深色背景 #1F2937)
- 顶部导航栏含 Logo 和用户信息
- 侧边栏包含: 首页、教师、课程、学生、财务、账号

### 3.2 移动端
- 底部固定 Tab 导航 (5个Tab)
- 顶部简易导航栏
- Tab: 首页 | 教师 | 课程 | 学生 | 财务

## 4. 页面清单

| 页面 | 路由 | 桌面端 | 移动端 |
|------|------|--------|--------|
| 登录页 | /login | Y | Y |
| Dashboard | /dashboard | Y | Y |
| 教师管理 | /teachers | Y | Y |
| 课程类型 | /course-types | Y | Y |
| 学生管理 | /students | Y | Y |
| 课时管理 | /courses | Y | Y |
| 财务管理 | /transactions | Y | Y |
| 账号管理 | /users | Y | N |
| 我的 | - | N | Y |

## 5. 组件规范

### 5.1 布局组件
- Layout - 响应式布局容器
- Sidebar - 桌面端侧边栏
- BottomNav - 移动端底部导航

### 5.2 通用组件
- Card - 数据卡片
- Button - 按钮
- Modal - 模态框
- Empty - 空状态
- Badge - 标签

## 6. API 对接

- Base URL: /api (Vite代理到 localhost:3002)
- 认证: JWT Token (localStorage)
- 请求拦截: 自动携带 Token
- 响应拦截: 401 跳转登录页

## 7. 文件结构

```
src/
  api/index.js          # API请求封装
  components/
    layout/
      Layout.jsx
      Sidebar.jsx
      BottomNav.jsx
    common/
      Card.jsx
      Button.jsx
      Modal.jsx
      Empty.jsx
  context/
    AuthContext.jsx     # 认证状态
  pages/
    Login.jsx
    Dashboard.jsx
    Teachers.jsx
    CourseTypes.jsx
    Students.jsx
    Courses.jsx
    Transactions.jsx
    Users.jsx
    MobileMine.jsx      # 移动端专属
  utils/
    format.js           # 格式化工具
  App.jsx
  main.jsx
  index.css
```
