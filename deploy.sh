#!/bin/bash
# 琴行管理系统部署脚本

set -e

# 配置
SERVER_IP="47.122.126.137"
SERVER_USER="root"
SSH_KEY="~/Downloads/keyPairForMac.pem"
PROJECT_DIR="/var/www/music-school"
BACKUP_DIR="/var/www/music-school-backup"

echo "🚀 开始部署琴行管理系统..."

# 创建备份
echo "📦 创建备份..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "mkdir -p $BACKUP_DIR && cp -r $PROJECT_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'First deployment, no backup needed'" || true

# 上传后端代码
echo "📤 上传后端代码..."
rsync -avz -e "ssh -i $SSH_KEY" --exclude='node_modules' --exclude='.env' /Users/yishunxin/WorkBuddy/20260329231952/server/ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/server/

# 上传前端构建文件
echo "📤 上传前端代码..."
rsync -avz -e "ssh -i $SSH_KEY" /Users/yishunxin/WorkBuddy/20260329231952/client/dist/ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/client/dist/

# 安装后端依赖
echo "🔧 安装后端依赖..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd $PROJECT_DIR/server && npm install --production"

# 重启后端服务
echo "🔄 重启后端服务..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd $PROJECT_DIR && pm2 restart music-school-api || pm2 start server/index.js --name music-school-api"

# 检查服务状态
echo "✅ 检查服务状态..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "pm2 status"

echo "🎉 部署完成！"
