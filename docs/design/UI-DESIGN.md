# UI 设计规范

## 1. 技术栈

| 项目 | 技术 |
|------|------|
| 框架 | React 18 + Vite |
| 样式 | Tailwind CSS 4 |
| 图标 | Lucide React |
| 路由 | React Router DOM v7 |
| 状态管理 | React Context |
| HTTP 客户端 | Axios |

## 2. 色彩系统

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色 | #3B82F6 | 按钮、重点强调 |
| 主色深 | #2563EB | 按钮悬停 |
| 成功色 | #10B981 | 成功提示、正向操作 |
| 警告色 | #F59E0B | 警告提示、课时不足 |
| 错误色 | #EF4444 | 错误提示、删除操作 |
| 背景色 | #F9FAFB | 页面背景 |
| 卡片色 | #FFFFFF | 卡片、表格背景 |
| 侧边栏 | #1F2937 | 桌面端侧边栏背景 |
| 侧边栏激活 | #374151 | 当前选中菜单项 |

## 3. 字体规范

| 项目 | 规范 |
|------|------|
| 主字体 | Inter, -apple-system, BlinkMacSystemFont, sans-serif |
| 字重 - 轻 | 300 |
| 字重 - 正常 | 400 |
| 字重 - 中等 | 500 |
| 字重 - 半粗 | 600 |
| 字重 - 粗 | 700 |

## 4. 响应式断点

| 端 | 断点 | 导航方式 |
|----|------|----------|
| 桌面端 | ≥768px | 侧边栏导航 |
| 移动端 | <768px | 底部Tab导航 |

## 5. 页面布局

### 5.1 桌面端布局

```
┌─────────────────────────────────────────────────┐
│  Logo                    用户信息                │ ← 顶部栏
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  首页    │                                      │
│  教师    │          主内容区域                  │
│  课程    │                                      │
│  学生    │                                      │
│  财务    │                                      │
│  账号    │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
   侧边栏
```

- 左侧固定侧边栏：深色背景 (#1F2937)
- 侧边栏宽度：约 200px
- 内容区域：自适应

### 5.2 移动端布局

```
┌─────────────────────────┐
│  Logo        用户信息   │ ← 顶部栏
├─────────────────────────┤
│                         │
│                         │
│      主内容区域          │
│                         │
│                         │
├─────────────────────────┤
│ 首页│教师│课程│学生│财务│  ← 底部Tab
└─────────────────────────┘
```

- 底部固定 Tab 栏（5个Tab）
- Tab 高度：约 60px

## 6. 页面清单

| 页面 | 路由 | 桌面端 | 移动端 |
|------|------|--------|--------|
| 登录页 | /login | ✓ | ✓ |
| 首页/Dashboard | /dashboard | ✓ | ✓ |
| 教师管理 | /teachers | ✓ | ✓ |
| 课程类型 | /course-types | ✓ | ✓ |
| 学生管理 | /students | ✓ | ✓ |
| 课时管理 | /courses | ✓ | ✓ |
| 财务管理 | /transactions | ✓ | ✓ |
| 账号管理 | /users | ✓ | ✗ |
| 我的（移动端） | - | ✗ | ✓ |

## 7. 组件规范

### 7.1 布局组件

| 组件 | 说明 |
|------|------|
| Layout | 响应式布局容器 |
| Sidebar | 桌面端侧边栏 |
| BottomNav | 移动端底部导航 |
| TopBar | 顶部导航栏 |

### 7.2 通用组件

| 组件 | 说明 |
|------|------|
| Card | 数据展示卡片 |
| Button | 按钮（主、次、危险） |
| Modal | 模态对话框 |
| Empty | 空状态提示 |
| Badge | 标签/徽章 |
| Table | 数据表格 |
| Form | 表单容器 |
| Input | 输入框 |
| Select | 下拉选择 |
| DatePicker | 日期选择 |

### 7.3 组件状态

| 状态 | 说明 |
|------|------|
| Default | 默认状态 |
| Hover | 悬停状态 |
| Active/Pressed | 按下状态 |
| Disabled | 禁用状态 |
| Loading | 加载状态 |
| Error | 错误状态 |

## 8. 交互规范

### 8.1 按钮交互

- 主按钮：蓝色背景，白色文字
- 次按钮：白色背景，蓝色边框
- 危险按钮：红色背景，用于删除操作
- 悬停：颜色加深 10%
- 点击：缩放 0.98

### 8.2 列表交互

- 悬停行：背景色变化
- 点击行：跳转详情或打开编辑
- 删除：需二次确认

### 8.3 表单交互

- 必填项：红色星号标识
- 输入验证：即时反馈
- 提交按钮：Loading 状态

## 9. API 对接规范

### 9.1 基础配置

- Base URL：`/api`（Vite 代理到 localhost:3002）
- 认证方式：JWT Token
- Token 存储：localStorage
- Token 键名：`token`

### 9.2 请求规范

```javascript
// 请求拦截：自动携带 Token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：401 跳转登录页
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 9.3 错误处理

```javascript
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息（开发环境）"
}
```

### 9.4 成功响应

```javascript
{
  "success": true,
  "data": { /* 数据 */ },
  "message": "操作成功"
}
```

## 10. 文件结构

```
client/src/
├── api/
│   └── index.js           # API 请求封装
├── assets/                # 静态资源
├── components/
│   ├── layout/            # 布局组件
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── BottomNav.jsx
│   └── common/            # 通用组件
│       ├── Card.jsx
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Empty.jsx
│       └── Badge.jsx
├── context/
│   └── AuthContext.jsx    # 认证状态管理
├── pages/                 # 页面组件
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Teachers.jsx
│   ├── CourseTypes.jsx
│   ├── Students.jsx
│   ├── Courses.jsx
│   ├── Transactions.jsx
│   ├── Users.jsx
│   └── MobileMine.jsx     # 移动端专属
├── utils/
│   └── format.js          # 格式化工具
├── App.jsx                # 主应用入口
├── main.jsx               # 入口文件
└── index.css              # 全局样式
```

---

*文档版本：v1.0*
*最后更新：2026-05-10*
