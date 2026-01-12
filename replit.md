# Replit.md - Financial Dashboard Project

## Overview

This is a financial dashboard application for tracking sales and generating reports. The system reads sales data from a PostgreSQL database (originally Supabase), differentiates between products sold via social networks (with `sub_id`) and Shopee Video (without `sub_id`), and allows daily CSV uploads and manual/automatic report generation.

The application follows a monorepo structure with a React frontend and Express backend, using Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with tsx for development
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` with Drizzle table definitions
- **Key Tables**:
  - `shopee_vendas` - Main sales import table
  - `vendas_redes_sociais` - Social network sales (products WITH sub_id)
  - `vendas_shopee_video` - Shopee Video sales (products WITHOUT sub_id)
  - `relatorios` - Daily reports with unique constraint on (sub_id, data)
  - `gastos` - Expenses linked to reports

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Page components
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code
│   ├── schema.ts     # Drizzle schema definitions
│   └── routes.ts     # API contracts with Zod
└── migrations/       # Drizzle migrations
```

### Key Business Rules
1. Products WITH `sub_id` originate from Social Networks and can generate reports
2. Products WITHOUT `sub_id` originate from Shopee Video (view-only, no reports)
3. CSV uploads replace daily sales data (delete + insert pattern)
4. Reports have unique constraint on sub_id + date combination

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database toolkit with `drizzle-kit` for migrations (`npm run db:push`)

### Frontend Libraries
- **papaparse**: CSV parsing for file uploads
- **recharts**: Financial charts and data visualization
- **date-fns**: Date formatting and manipulation
- **Radix UI**: Headless UI primitives for accessible components

### Development Tools
- **Vite**: Frontend build and dev server with HMR
- **esbuild**: Production server bundling
- **TypeScript**: Full-stack type safety

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Development tooling
- `connect-pg-simple`: Session storage (if sessions are used)