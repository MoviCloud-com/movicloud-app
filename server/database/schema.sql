-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    avatar VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 安装状态表
CREATE TABLE IF NOT EXISTS installation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_installed BOOLEAN DEFAULT 0,
    installed_at DATETIME,
    version VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认设置
INSERT INTO settings (key, value, description) VALUES
('tmdb_api_key', '', 'TMDB API密钥'),
('tmdb_api_base_url', '', 'TMDB API基础URL'),
('tmdb_image_base_url', '', 'TMDB图片基础URL'),
('proxy_enabled', '0', '是否启用代理'),
('http_proxy', '', 'HTTP代理地址'),
('https_proxy', '', 'HTTPS代理地址'),
('all_proxy', '', 'SOCKS5代理地址'),
('site_name', 'MoviCloud', '网站名称'),
('site_description', '影视云盘', '网站描述'),
('theme_mode', 'auto', '主题模式'),
('language', 'zh-CN', '默认语言'); 