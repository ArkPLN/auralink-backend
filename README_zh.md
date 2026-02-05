# 🌟 AuraLink - 后端

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  一款智能、轻量级的AI驱动的智能校园社团平台。
  <br />
  <strong>连接 · 协作 · 成长</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-FE0C2C?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM" />
  <a href="https://api.example.com/docs"><img src="https://img.shields.io/badge/Scalar-1A1A1A?style=for-the-badge&logo=scalar&logoColor=white" alt="Scalar API 文档" /></a>
</p>

<div align="center">

<a href="readme.md">
  <img src="https://img.shields.io/badge/🇺🇸-English-blue?style=for-the-badge&label=语言" alt="English" />
</a>
<a href="README_zh.md">
  <img src="https://img.shields.io/badge/🇨🇳-中文-gray?style=for-the-badge&label=LANGUAGE" alt="中文" />
</a>

</div>

---

## 📖 项目介绍

**AuraLink** 是一个下一代AI驱动的平台，旨在改变学生社团和专业社区的运作方式。远远超出基础管理工具，AuraLink 将核心功能——无缝注册、数字成员名单、共享日历、公告栏和云存储——整合到一个统一的生态系统中。

我们的核心差异化在于深度集成的 **AI 知识库**。这个系统不仅仅是存储信息，它还能主动学习您社区的文档、讨论和活动，有效地成为组织的集体大脑。

本仓库包含了 AuraLink 生态系统的**后端 API** 服务。

## ✨ 核心功能 (后端)

> **目前，我们的团队仍在开发后端功能。以下介绍的功能即将推出，我们不承诺完整的功能列表。**

*   **🔐 高级认证**:
    *   安全的学生账号登录系统。
    *   基于JWT的无状态认证（访问令牌 + 刷新令牌）。
    *   适用于管理员和成员的角色基于访问控制(RBAC)。
    *   使用Bcrypt进行密码哈希。
*   **👤 成员管理**:
    *   完整的生命周期管理（注册、资料更新）。
    *   部门和角色分配。
*   **📚 交互式API文档**:
    *   集成 **Scalar API Reference**，提供美观、可测试的API文档。
    *   生成 OpenAPI (Swagger) 规范。
*   **🗄️ 数据库**:
    *   PostgreSQL集成通过TypeORM。
    *   自动实体同步。

## 🛠️ 技术栈

*   **框架**: [NestJS](https://nestjs.com/)
*   **语言**: TypeScript
*   **数据库**: PostgreSQL
*   **ORM**: TypeORM
*   **认证**: Passport-JWT, Bcrypt
*   **API文档**: Scalar & Swagger

## 🚀 快速开始

### 前置条件

*   Node.js (v18+)
*   PostgreSQL (本地或 Docker)
*   npm 或 pnpm

### 安装

1.  **克隆仓库**
    ```bash
    git clone https://github.com/arkpln/auralink-backend.git
    cd auralink-backend
    ```

2.  **安装依赖**
    ```bash
    pnpm install
    ```

3.  **环境配置**
    在根目录下创建 `.env` 文件，根据您的配置填写：
    ```env
    # 数据库
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=您的密码
    DB_DATABASE=auralink_db

    # JWT密钥
    ACCESS_TOKEN_SECRET=您的超级密钥
    REFRESH_TOKEN_SECRET=您的刷新密钥

    # 端口
    PORT=3000
    ```

### 运行应用

```bash
# 开发模式
npm run start

# 监听模式（推荐开发使用）
npm run start:dev

# 生产模式
npm run start:prod
```
