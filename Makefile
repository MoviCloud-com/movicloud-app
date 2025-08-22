.PHONY: help install dev build start docker-build docker-run docker-compose-up docker-compose-down deploy clean

# 默认目标
help:
	@echo "MoviCloud 应用管理命令"
	@echo ""
	@echo "开发命令:"
	@echo "  install       安装依赖"
	@echo "  dev          启动开发服务器 (端口: 25081)"
	@echo "  build        构建生产版本"
	@echo "  start        启动生产服务器 (端口: 15078)"
	@echo ""
	@echo "Docker 命令:"
	@echo "  docker-build 构建 Docker 镜像"
	@echo "  docker-run   运行 Docker 容器"
	@echo "  docker-compose-up    使用 Docker Compose 启动服务"
	@echo "  docker-compose-down  停止 Docker Compose 服务"
	@echo ""
	@echo "部署命令:"
	@echo "  deploy       运行部署脚本"
	@echo "  clean        清理构建文件"
	@echo ""
	@echo "使用: make <命令>"

# 安装依赖
install:
	npm install

# 开发模式
dev:
	npm run dev

# 构建应用
build:
	npm run build

# 启动生产服务器
start:
	npm run start

# 构建 Docker 镜像
docker-build:
	docker build -t movicloud-app .

# 运行 Docker 容器
docker-run:
	docker run -d -p 15078:15078 --name movicloud-app movicloud-app

# 使用 Docker Compose 启动
docker-compose-up:
	docker-compose up -d

# 停止 Docker Compose 服务
docker-compose-down:
	docker-compose down

# 运行部署脚本
deploy:
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh

# 清理构建文件
clean:
	rm -rf .output .nuxt dist .cache
	docker system prune -f 