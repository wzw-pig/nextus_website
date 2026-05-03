# Nextus 团队网站（官网 + 后台 + 内网）

这是一个基于 **Next.js + Prisma + PostgreSQL** 的完整项目，包含：

- 官网首页（团队介绍、历史项目、成果展示、团队风采、新闻、资料下载、联系我们）
- 后台管理系统（管理员登录、新闻/首页内容/内网账号/管理员账号的增查删改）
- 内网系统（登录、论坛发帖回帖、财务申请与审批）

## 1. 环境准备

1. 复制环境变量模板：
   - Windows PowerShell:
     ```powershell
     Copy-Item .env.example .env.local
     ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 生成 Prisma 客户端并迁移数据库：
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. 初始化基础数据（论坛分类 + 可选超级管理员）：
   ```bash
   npm run prisma:seed
   ```
5. 启动开发：
   ```bash
   npm run dev
   ```

## 2. 数据库连接填写位置

在根目录 **`.env.local`** 里填写：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/nextus_db?schema=public"
```

部署到 Vercel/Cloudflare 时，也要在平台环境变量里配置同名 `DATABASE_URL`。

## 3. 核心安全变量

在 `.env` 里配置：

- `JWT_SECRET`：会话签名密钥（必须长随机串）
- `SUPER_ADMIN_INIT_TOKEN`：首次创建超级管理员时的口令
- `BLOB_READ_WRITE_TOKEN`：Vercel Blob 读写令牌（用于新闻/论坛附件上传）

## 4. 超级管理员说明

- 首次访问 `/admin/bootstrap` 使用 `SUPER_ADMIN_INIT_TOKEN` 创建首个超级管理员。
- 超级管理员可在后台继续创建和修改其他超级管理员、普通管理员账号。
- 普通管理员不可管理管理员账号。

## 5. 新闻与论坛附件（Vercel Blob）

- 后台发布新闻、内网论坛发帖时均可上传图片/视频/文件附件（支持多选）。
- 内网论坛回帖同样支持上传附件（支持多选）。
- 附件会自动上传到 Vercel Blob，并在帖子/新闻详情展示下载链接。
- 下载为 OSS 直连，用户点击附件名称即可下载。
- 新闻封面图改为图片上传；未上传时默认使用 `/logo.png`。
- 资料发布改为上传文件（不限格式），不再手动输入下载 URL，且入口在内网系统。
- 后台新增“首页内容管理”，可分别维护历史项目、成果展示、团队风采三个模块的图片与文案。
- 内网可配置内网管理员账号，支持删除他人帖子或单个附件（必填删除理由），并向被操作用户发送系统站内信通知。

## 6. 部署

### Vercel

1. 导入项目到 Vercel
2. 配置环境变量：`DATABASE_URL`、`JWT_SECRET`、`SUPER_ADMIN_INIT_TOKEN`、`BLOB_READ_WRITE_TOKEN`
3. 构建命令：`npm run build`
4. 启动命令：`npm run start`

### Cloudflare

部署在cloudflare上的域名指向Vercel部署成果。

