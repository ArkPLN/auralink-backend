# 🌟 AuraLink - Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  An intelligent, lightweight, and AI-powered smart campus society platform.
  <br />
  <strong>Connect. Collaborate. Evolve.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-FE0C2C?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM" />
  <img src="https://img.shields.io/badge/Scalar-1A1A1A?style=for-the-badge&logo=scalar&logoColor=white" alt="Scalar API Docs" />
</p>

---

🌐 **Language**: [English](README.md) | [中文](README_zh.md)

## 📖 Introduction

**AuraLink** is a next-generation, AI-powered platform designed to transform how student societies and professional communities operate. Moving far beyond basic management tools, AuraLink integrates core functionalities—seamless registration, digital membership rosters, shared calendars, announcement boards, and cloud storage—into a single, cohesive ecosystem.

Our key differentiator is the deeply integrated **AI Knowledge Vault**. This system doesn't just store information; it actively learns from your community's documents, discussions, and activities, effectively becoming the collective brain of your organization.

This repository contains the **Backend API** services powering the AuraLink ecosystem.

## ✨ Core Features (Backend)

> **Currently,Our team are still working on the backend features.These introduced features will be available soon. We don't promise a complete feature list yet.**

*   **🔐 Advanced Authentication**: 
    *   Secure School ID login system.
    *   JWT-based stateless authentication (Access + Refresh Tokens).
    *   Role-Based Access Control (RBAC) for Admins and Members.
    *   Password hashing with Bcrypt.
*   **👤 Member Management**: 
    *   Full lifecycle management (Registration, Profile updates).
    *   Department and Role assignment.
*   **📚 Interactive API Documentation**: 
    *   Integrated **Scalar API Reference** for beautiful, testable API docs.
    *   OpenAPI (Swagger) spec generation.
*   **🗄️ Database**: 
    *   PostgreSQL integration via TypeORM.
    *   Automated Entity synchronization.

## 🛠️ Tech Stack

*   **Framework**: [NestJS](https://nestjs.com/)
*   **Language**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: TypeORM
*   **Authentication**: Passport-JWT, Bcrypt
*   **API Docs**: Scalar & Swagger

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   PostgreSQL (Local or Docker)
*   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/arkpln/auralink-backend.git
    cd auralink-backend
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory based on your configuration:
    ```env
    # Database
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=your_password
    DB_DATABASE=auralink_db

    # JWT Secrets
    ACCESS_TOKEN_SECRET=your_super_secret_access_key
    REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
    ```

### Running the App

```bash
# development
npm run start

# watch mode (recommended for dev)
npm run start:dev

# production mode
npm run start:prod