# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 安装依赖
RUN apk add --no-cache libc6-compat
WORKDIR /movicloud-app

# 复制应用文件
COPY package*.json ./
COPY . .

# 安装依赖（包括开发依赖）
RUN npm install

# 设置环境变量
ENV NODE_ENV=development
ENV PORT=15078
ENV HOSTNAME="0.0.0.0"

# 暴露端口
EXPOSE 15078

# 以开发模式运行
CMD ["npm", "run", "dev"]