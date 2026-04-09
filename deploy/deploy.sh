#!/bin/bash
# DocuGen AI 部署脚本 - CentOS 7.9 离线环境
set -e

DEPLOY_DIR="/root/docugen-ai-cn"
cd "$DEPLOY_DIR"

echo "=== 1. 安装 PyJWT 到 API 基础镜像 ==="
# 创建一个临时容器安装 PyJWT，然后 commit 成新镜像
docker run --name docugen-jwt-install -d ai-cmdb-api:latest sleep 300
docker cp "$DEPLOY_DIR/backend/pyjwt-2.12.1-py3-none-any.whl" docugen-jwt-install:/tmp/
docker exec docugen-jwt-install pip install /tmp/pyjwt-2.12.1-py3-none-any.whl
docker commit docugen-jwt-install docugen-api:v1
docker rm -f docugen-jwt-install
echo "   镜像 docugen-api:v1 已创建"

echo "=== 2. 创建前端镜像 ==="
# 复用 nginx 镜像
docker run --name docugen-frontend-build -d ai-cmdb-showcase-frontend:v2 sleep 300
# 清空旧内容
docker exec docugen-frontend-build sh -c "rm -rf /usr/share/nginx/html/*"
# 复制新前端文件
docker cp "$DEPLOY_DIR/frontend/." docugen-frontend-build:/usr/share/nginx/html/
# 替换 nginx 配置
docker cp "$DEPLOY_DIR/nginx.conf" docugen-frontend-build:/etc/nginx/conf.d/default.conf
docker commit docugen-frontend-build docugen-frontend:v1
docker rm -f docugen-frontend-build
echo "   镜像 docugen-frontend:v1 已创建"

echo "=== 3. 创建 Docker 网络 ==="
docker network create docugen-net 2>/dev/null || true

echo "=== 4. 停止旧容器（如存在）==="
docker rm -f docugen-api docugen-frontend 2>/dev/null || true

echo "=== 5. 启动后端容器 ==="
docker run -d \
  --name docugen-api \
  --network docugen-net \
  --restart unless-stopped \
  --add-host=aiapi.colasoft.cn:192.168.3.119 \
  -v "$DEPLOY_DIR/backend/data:/app/data" \
  -p 8001:8001 \
  -w /app \
  docugen-api:v1 \
  python3 -m uvicorn main:app --host 0.0.0.0 --port 8001

echo "   后端启动中..."
sleep 2

echo "=== 6. 启动前端容器 ==="
docker run -d \
  --name docugen-frontend \
  --network docugen-net \
  --restart unless-stopped \
  -p 9000:80 \
  docugen-frontend:v1

echo "   前端启动中..."
sleep 2

echo "=== 7. 检查状态 ==="
echo "后端:"
docker logs docugen-api --tail 5 2>&1 || true
echo ""
echo "前端:"
docker logs docugen-frontend --tail 5 2>&1 || true
echo ""
echo "=== 部署完成 ==="
echo "前端: http://192.168.33.87:9000"
echo "后端: http://192.168.33.87:8001"
echo ""
docker ps --filter "name=docugen" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
