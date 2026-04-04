# 琴行课时管理系统 - 云服务器部署指南

## 环境要求

- Node.js >= 18
- MySQL >= 8.0
- Nginx (用于前端静态文件托管)

---

## 第一步：服务器环境准备

### 1.1 安装 Node.js

```bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 1.2 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 1.3 创建数据库

```bash
mysql -u root -p

# 在 MySQL 命令行中执行
CREATE DATABASE music_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'music_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON music_school.* TO 'music_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 第二步：部署后端

### 2.1 上传代码到服务器

```bash
# 在服务器上克隆或上传代码
cd /var/www
git clone https://github.com/yishunxin/music-school.git
cd music-school/server
```

### 2.2 安装依赖

```bash
npm install
```

### 2.3 配置环境变量

```bash
cp .env.example .env
nano .env  # 编辑配置
```

配置示例：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=music_user
DB_PASSWORD=your_password
DB_NAME=music_school
PORT=3001
JWT_SECRET=your_random_secret_key
```

### 2.4 启动后端服务

```bash
# 测试运行
npm start

# 使用 PM2 守护进程
npm install -g pm2
pm2 start index.js --name music-school-api

# 设置开机自启
pm2 save
pm2 startup
```

---

## 第三步：部署前端

### 3.1 构建生产版本

```bash
cd ../client
npm install
npm run build
```

### 3.2 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/music-school
```

Nginx 配置：
```nginx
server {
    listen 80;
    server_name your_domain.com;

    # 前端静态文件
    location / {
        root /var/www/music-school/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/music-school /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 第四步：配置 HTTPS (可选)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

---

## 第五步：验证部署

访问 `http://your_domain.com`，使用管理员账号登录：
- 用户名：`admin`
- 密码：`123456`

---

## 常用命令

```bash
# 查看后端日志
pm2 logs music-school-api

# 重启后端
pm2 restart music-school-api

# 查看 Nginx 状态
sudo systemctl status nginx

# 重载 Nginx 配置
sudo systemctl reload nginx
```

---

## 防火墙配置

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```
