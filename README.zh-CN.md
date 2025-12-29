[English](README.md) | [简体中文](README.zh-CN.md)

# MoviCloud 影视云盘（Docker 优先安装指南）

MoviCloud 是一款基于 Nuxt 3 的影视聚合与浏览应用，集成 TMDB 数据，支持电影/剧集信息展示、搜索、个人资料、下载入口等功能。本文档聚焦“如何使用”，尤其是 Docker 安装与持久化。

## 亮点

- 🎬 电影/电视剧详情、演员与片单推荐
- ⚡ 前端图片懒加载与缓存，体验流畅
- 🌙 深色主题与响应式布局
- 🧭 安装向导（首启自动引导配置）
- 🐳 官方 Docker 镜像：`movicloud/movicloud-app`（支持 amd64/arm64）

---

## 一、快速开始

### 方式 A：飞牛OS 商店安装（推荐飞牛OS用户使用）

如果您使用的是飞牛OS系统，可以前往 [GitHub Releases](https://github.com/MoviCloud-com/movicloud-app/releases) 页面下载适配飞牛商店的安装包。

### 方式 B：Docker 安装

#### 1) 拉取镜像
```bash
docker pull movicloud/movicloud-app:latest
```

#### 2) 一键运行（最简）
```bash
docker run -d \
  --name movicloud \
  -p 15078:15078 \
  -v movi_data:/movicloud-app/data \
  -e NODE_ENV=production \
  movicloud/movicloud-app:latest
```
- 访问地址：`http://<你的IP或域名>:15078`
- 首次进入会自动跳转安装向导（`/install`）
- 数据（数据库、上传头像等）持久化在容器路径：`/movicloud-app/data`

#### 3) 推荐：Docker Compose
```yaml
services:
  movicloud:
    image: movicloud/movicloud-app:latest
    container_name: movicloud
    restart: unless-stopped
    ports:
      - "15078:15078"
    environment:
      - NODE_ENV=production
      # 可选：时区与 JWT 密钥
      - TZ=Asia/Shanghai
      - JWT_SECRET=your-strong-secret
      # 可选：网络在受限环境下的代理（仅当需要）
      # - HTTP_PROXY=http://host.docker.internal:7890
      # - HTTPS_PROXY=http://host.docker.internal:7890
      # - NO_PROXY=localhost,127.0.0.1
    volumes:
      - movi_data:/movicloud-app/data
volumes:
  movi_data:
```
启动：
```bash
docker compose up -d
```

---

## 二、首次安装向导

1. 访问 `http://<你的IP或域名>:15078/install`
2. 在向导中完成：
   - TMDB API Key 配置
   - 语言与主题
   - （如需要）网络代理配置
   - 创建管理员账号
3. 完成后即可使用，所有设置支持在“设置”页面修改。

提示：系统会将常用设置缓存到前端。修改设置后，前端缓存会自动刷新。

---

## 三、数据持久化与目录说明

- 应用数据：`/movicloud-app/data`
  - 数据库：`/movicloud-app/data/movicloud.db`
  - 上传头像：`/movicloud-app/data/uploads/avatars`
- 日志目录：`/movicloud-app/logs`（如需挂载，可自定义）
- 生产环境静态访问：`/uploads/avatars/<文件名>`
  - 示例：`http://<你的域名>/uploads/avatars/avatar_1690000000000.png`

使用命名卷或绑定宿主机目录均可，例如：
```bash
docker run -d \
  --name movicloud \
  -p 15078:15078 \
  -v /your/host/path/data:/movicloud-app/data \
  movicloud/movicloud-app:latest
```

> 若使用宿主目录，请确保宿主目录对容器内运行用户（默认 `node`）可写。

---

## 四、升级与回滚

- 升级至最新：
```bash
docker pull movicloud/movicloud-app:latest
# 若使用 run 方式：先停止并删除旧容器，再以相同卷参数启动
docker stop movicloud && docker rm movicloud
# 重新运行（保持同样的 -v 卷映射）
```
- Docker Compose：
```bash
docker compose pull
docker compose up -d
```
- 回滚到某版本：
```bash
docker run -d ... movicloud/movicloud-app:1.0.1
```

镜像标签策略（示例）：`latest`、语义化版本（如 `1.0.1`、`1.0`）。

---

## 五、常见问题（FAQ）

- 问：访问不到页面？
  - 检查端口映射是否为 `-p 15078:15078`
  - 若有反向代理，确认转发到容器端口 `15078`

- 问：在 Docker 中头像不保存或访问不到？
  - 确认已挂载 `data` 卷：`/movicloud-app/data`
  - 访问路径应形如：`/uploads/avatars/<文件名>`
  - 若使用宿主目录，确保写权限（推荐使用命名卷）

- 问：网络受限地区图片或 TMDB 访问慢？
  - 在安装向导或“设置”中配置代理；或在容器环境变量中设置 `HTTP_PROXY/HTTPS_PROXY`
  - 应用会缓存 TMDB 图片域名设置，修改设置后前端会刷新缓存

- 问：如何健康检查？
  - 健康检查接口：`/api/health`（返回 200 表示正常）

- 问：如何自定义安全与时区？
  - 设置环境变量 `JWT_SECRET` 与 `TZ`

---

## 六、反向代理（可选）

以 Nginx 为例：
```nginx
server {
  listen 80;
  server_name your.domain.com;

  location / {
    proxy_pass http://127.0.0.1:15078;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # 上传文件静态访问（可选，应用已内置处理 /uploads/ 路由）
  location /uploads/ {
    proxy_pass http://127.0.0.1:15078;
  }
}
```

---

## 七、开发计划

以下功能将在后续版本中陆续上线：

### 网盘集成
- **网盘 SDK 集成**：集成网盘 SDK，实现网盘账号添加功能。为安全起见，所有账号信息和授权信息都将保存在本地，不会上传到云端。
- **文件直接转存**：分享文件可直接转存到用户的网盘，方便用户访问。
- **资源提交增强**：用户在提交影视资源时，将弹出窗口从已绑定的网盘账号中选择文件，自动生成分享链接。

### 网盘活动
- **VIP 活动**：陆续上线免费开通和续期网盘 VIP 的活动。
- **扩容活动**：陆续上线免费扩容网盘容量的活动。

### 社交与社区功能
- **影评功能**：新增影评功能，用户可以分享对影视作品的看法和评分。
- **社交动态或聊天室**：新增社交动态或交流聊天室功能，方便用户互动交流。

### AI 功能
- **AI 搜索**：新增 AI 搜索功能，需要用户自己使用大模型的 API key。

---

## 八、页面截图

- 安装欢迎：

  ![安装欢迎](screenshots/install-welcome.png)

- 安装TMDB设置：

  ![安装TMDB设置](screenshots/install-tmdb.png)

- 安装用户设置：

  ![安装用户设置](screenshots/install-user.png)

- 安装确认：

  ![安装确认](screenshots/install-confirm.png)

- 安装成功：

  ![安装成功](screenshots/install-success.png)

- 用户登录：

  ![用户登录](screenshots/login.png)

- 首页轮播与推荐：
  
  ![占位-首页](screenshots/home.png)

- 电影库：

  ![电影库](screenshots/movie-library.png)

- 电影详情页：

  ![电影详情页](screenshots/movie-detail.png)

- 电影下载窗口：

  ![电影下载窗口](screenshots/movie-download.png)

- 电影资源分享窗口：

  ![电影资源分享窗口](screenshots/movie-post.png)

- 电视剧库：

  ![电视剧库](screenshots/tv-library.png)

- 电视剧详情页：

  ![电视剧详情页](screenshots/tv-detail.png)

- 电视剧下载窗口：

  ![电视剧下载窗口](screenshots/tv-download.png)

- 电视剧资源分享窗口：

  ![电视剧资源分享窗口](screenshots/tv-post.png)

- 电视剧剧情详情窗口：

  ![电视剧剧情详情窗口](screenshots/tv-season.png)

- 演职人员详情：
  
  ![演职人员详情](screenshots/person-detail.png)

- 搜索窗口：
  
  ![搜索窗口](screenshots/search.png)

- 主题和字体设置：
  
  ![主题和字体设置](screenshots/settings-theme.png)

- TMDB设置：
  
  ![TMDB设置](screenshots/settings-tmdb.png)

- 系统代理设置：
  
  ![系统代理设置](screenshots/settings-proxy.png)

- 系统语言设置：
  
  ![系统语言设置](screenshots/settings-language.png)

- 个人设置：
  
  ![个人设置](screenshots/profile.png)
