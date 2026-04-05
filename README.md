# CRM + POS Backend (Node.js/Express/MongoDB)

Production-style backend scaffold using MVC architecture.

## Features

- Express API with MVC folder structure
- MongoDB + Mongoose models with schema relationships
- JWT authentication + role-based authorization
- Password hashing with bcrypt
- Validation with express-validator
- Centralized error handling middleware
- Security middleware (helmet, cors) + API rate limiting
- API-level pagination and search

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file and update values:
   ```bash
   cp .env.example .env
   ```
3. Seed base roles:
   ```bash
   POST /api/auth/seed-roles
   ```
   In production, include setup header: `x-setup-secret: <SETUP_SECRET>`.
4. Start server:
   ```bash
   npm run dev
   ```

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/POST /api/customers` (supports `page`, `limit`, `search`)
- `GET/POST /api/products` (supports `page`, `limit`, `search`)
- `GET/POST /api/orders` (supports `page`, `limit`)

## Notes

- Public registration creates `STAFF` users only.
- Create `ADMIN` users directly in the database or via a protected admin workflow.
- Product creation is admin-only.
- Add bearer token in `Authorization: Bearer <token>` for protected routes.
