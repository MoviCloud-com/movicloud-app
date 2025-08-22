# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
# 检查 https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine 了解为什么需要 libc6-compat
RUN apk add --no-cache libc6-compat
WORKDIR /movicloud-app

# 安装依赖
COPY package.json ./
RUN npm install --only=production

# 重新构建源码
FROM base AS builder
WORKDIR /movicloud-app
COPY --from=deps /movicloud-app/node_modules ./node_modules
COPY . .

# 确保scripts目录存在
RUN ls -la scripts/

# 构建应用
RUN npm run build

# 生产镜像，复制所有文件并运行Nuxt应用
FROM base AS runner
WORKDIR /movicloud-app

ENV NODE_ENV=production

# 创建必要的目录
RUN mkdir -p data logs data/uploads/avatars

# 复制构建输出
COPY --from=builder /movicloud-app/.output ./

# 复制public目录
COPY --from=builder /movicloud-app/public ./public

# 设置正确的权限
RUN chown -R node:node .
RUN chmod 755 data logs
RUN chmod -R 755 data/uploads

USER node

EXPOSE 15078

ENV PORT=15078
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server/index.mjs"] 