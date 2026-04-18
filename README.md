# Nextus 团队网站（官网 + 后台 + 内网）

这是一个基于 **Next.js + Prisma + PostgreSQL** 的完整项目，包含：

- 官网首页（团队介绍、部门介绍子菜单、新闻、资料下载、关于我们、联系我们）
- 后台管理系统（管理员登录、新闻/资料/内网账号/管理员账号的增查删改）
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

在 `.env.local` 里配置：

- `JWT_SECRET`：会话签名密钥（必须长随机串）
- `SUPER_ADMIN_INIT_TOKEN`：首次创建超级管理员时的口令

## 4. 超级管理员说明

- 系统只允许 **一个** 超级管理员。
- 首次访问 `/admin/bootstrap` 使用 `SUPER_ADMIN_INIT_TOKEN` 创建。
- 创建后不可再创建第二个超级管理员。
- 超级管理员可管理普通管理员账号；普通管理员不可管理管理员账号。

## 5. 部署

### Vercel

1. 导入项目到 Vercel
2. 配置环境变量：`DATABASE_URL`、`JWT_SECRET`、`SUPER_ADMIN_INIT_TOKEN`
3. 构建命令：`npm run build`
4. 启动命令：`npm run start`

### Cloudflare

可使用 Next.js 的 Cloudflare 适配方案（如 OpenNext），同样需要配置上述环境变量，并确保数据库可从公网访问。

