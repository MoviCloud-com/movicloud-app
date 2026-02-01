[English](README.md) | [简体中文](README.zh-CN.md)

# MoviCloud 影视云盘

MoviCloud 是一款基于 Nuxt 3 的影视聚合与浏览应用，集成 TMDB 数据，支持电影/剧集信息展示、搜索、个人资料、下载入口等功能。

## 亮点

- 🎬 电影/电视剧详情、演员与片单推荐
- ⚡ 前端图片懒加载与缓存，体验流畅
- 🌙 深色主题与响应式布局
- 🧭 安装向导（首启自动引导配置）
- � 支持飞牛 (fnOS)、群晖 (Synology) 及 Docker 安装

---

## 一、安装指南

我们推荐您在 NAS 设备上安装 MoviCloud 以获得最佳体验。

### 1. 飞牛 (fnOS) 安装（推荐）

您可以通过以下两种方式在飞牛 NAS 上安装 MoviCloud：

*   **应用商店安装**：打开飞牛应用商店，搜索 "MoviCloud" 直接安装。
*   **手动安装**：前往 [GitHub Releases](https://github.com/MoviCloud-com/movicloud-app/releases) 页面下载最新版本的 `.fpk` 安装包，然后在飞牛系统中手动上传安装。

![飞牛OS](screenshots/fnnas.png)

### 2. 群晖 (Synology) 安装（推荐）

前往 [GitHub Releases](https://github.com/MoviCloud-com/movicloud-app/releases) 页面下载最新版本的 `.spk` 安装包，然后在群晖套件中心手动上传安装。

### 3. Docker 安装

如果您熟悉 Docker，也可以使用以下命令快速启动：

```bash
docker run -d \
  --name movicloud \
  -p 15078:15078 \
  -v movi_data:/movicloud-app/data \
  -e NODE_ENV=production \
  movicloud/movicloud-app:latest
```

*   访问地址：`http://<你的IP或域名>:15078`
*   数据持久化：`/movicloud-app/data`

---

## 二、首次安装向导

1. 访问应用地址（默认端口 15078）
2. 在向导中完成：
   - TMDB API Key 配置
   - 语言与主题
   - 创建管理员账号
3. 完成后即可使用，所有设置支持在"设置"页面修改。

提示：系统会将常用设置缓存到前端。修改设置后，前端缓存会自动刷新。

---

## 三、数据持久化与目录说明

无论您使用哪种安装方式，应用数据都存储在以下位置：

- 应用数据：`/movicloud-app/data`
  - 配置文件：`/movicloud-app/data/movicloud.conf`（系统设置、用户数据、安装状态）
  - 上传头像：`/movicloud-app/data/uploads/avatars`
- 日志目录：`/movicloud-app/logs`

> **注意**：从 1.0.2 版本开始，应用使用 `.conf` 配置文件（类似 qBittorrent 的配置格式）替代数据库。所有设置、用户数据和安装状态都存储在 `movicloud.conf` 中。

---

## 四、升级与回滚

- **NAS 用户**：在应用商店更新或下载新版安装包覆盖安装。
- **Docker 用户**：拉取新镜像并重建容器。

> **升级说明**：如果您从 1.0.1 或更早版本升级，系统会在首次启动时自动将旧数据库（`movicloud.db`）的数据迁移到新的配置文件（`movicloud.conf`）。

---

## 五、常见问题（FAQ）

- 问：访问不到页面？
  - 检查端口映射是否正确（默认 15078）
  - 若有反向代理，确认转发配置正确

- 问：网络受限地区图片或 TMDB 访问慢？
  - 应用会缓存 TMDB 图片域名设置，修改设置后前端会刷新缓存

- 问：如何健康检查？
  - 健康检查接口：`/api/health`（返回 200 表示正常）

---

## 六、开发计划

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

## 七、页面截图

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

- 系统语言设置：
  
  ![系统语言设置](screenshots/settings-language.png)

- 个人设置：
  
  ![个人设置](screenshots/profile.png)
