# 构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /movicloud-app

# 安装必要工具
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# 复制包管理文件
COPY package.json ./

# 安装依赖
RUN yarn install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN yarn build

# 生产阶段
FROM node:22-alpine AS runner

# 设置工作目录
WORKDIR /movicloud-app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nuxtjs -u 1001

# 从构建阶段复制构建产物
COPY --from=builder --chown=nuxtjs:nodejs /movicloud-app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /movicloud-app/package.json ./package.json

# 创建必要的目录并设置权限
RUN mkdir -p data logs data/uploads/avatars && \
    chown -R nuxtjs:nodejs /movicloud-app

# 切换用户
USER nuxtjs

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=15078
ENV NITRO_PORT=15078
ENV NITRO_HOST=0.0.0.0

# 暴露端口
EXPOSE 15078

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:15078/api/health || exit 1

# 启动应用
CMD ["node", ".output/server/index.mjs"]