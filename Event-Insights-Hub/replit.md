# CampusIntel - Event Attendance Prediction & Engagement Intelligence Dashboard

## Overview

CampusIntel is a full-stack web application that helps universities predict event attendance and understand engagement drivers. It combines historical event data analysis with machine learning-based predictions to support data-driven event planning decisions.

The system ingests synthetic campus event data (from CSV), stores it in PostgreSQL, provides interactive dashboards with charts and analytics, and offers an attendance prediction tool. The project is inspired by a machine learning pipeline (originally Python/scikit-learn) but implements the prediction logic and analytics server-side in TypeScript.

**Key pages:**
- **Dashboard** — Overview stats (total events, average attendance, top domain/speaker) with bar charts, pie charts, and line charts
- **Predictor** — Form-based tool where users input event parameters and get predicted attendance with confidence intervals
- **Analytics** — Advanced visualizations including radar charts (friction analysis) and scatter plots (interactivity correlation)
- **Model Registry** — Static display of ML model comparison metrics (Linear Regression, SVR, Random Forest)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side router)
- **State/Data Fetching:** TanStack React Query for server state management
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming, custom color palette with HSL values
- **Charts:** Recharts (BarChart, PieChart, LineChart, RadarChart, ScatterChart)
- **Animations:** Framer Motion for page transitions
- **Forms:** React Hook Form with Zod validation via @hookform/resolvers
- **Icons:** Lucide React
- **Path aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Runtime:** Node.js with Express
- **Language:** TypeScript, executed via tsx
- **Build:** Vite for client, esbuild for server bundling (see `script/build.ts`)
- **Dev mode:** Vite dev server with HMR proxied through Express
- **Production:** Static files served from `dist/public`

### Database
- **Database:** PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM:** Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema location:** `shared/schema.ts`
- **Migrations:** Generated via `drizzle-kit push` (config in `drizzle.config.ts`)
- **Key tables:**
  - `events` — Historical event data with domain, type, speaker, duration, frictions, attendance
  - `predictions` — Logged prediction requests with results and timestamps
- **Seeding:** On startup, the server checks if the events table is empty and seeds from a CSV file in `attached_assets/`

### Shared Layer
- `shared/schema.ts` — Drizzle table definitions and Zod insert schemas, shared between client and server
- `shared/routes.ts` — API route contracts with Zod response schemas, used by both frontend hooks and backend handlers

### API Structure
All API routes are prefixed with `/api/`:
- `GET /api/stats/overview` — Returns totalEvents, avgAttendance, topDomain, topSpeakerType
- `GET /api/stats/charts` — Returns chart data: attendanceByDomain, attendanceBySpeaker, interactivityCorrelation, frictionImpact
- `POST /api/predict` — Accepts event parameters, returns predictedAttendance, category (Low/Medium/High), confidenceInterval
- `GET /api/events` — Returns list of events (limited to 1000)

### Design Patterns
- **Storage abstraction:** `IStorage` interface in `server/storage.ts` with `DatabaseStorage` implementation — allows swapping storage backends
- **Type-safe API contracts:** Shared Zod schemas in `shared/routes.ts` are used by both the server for validation and the client hooks for response parsing
- **Custom hooks:** `client/src/hooks/use-campus-intel.ts` wraps all API calls with React Query

### Build & Scripts
- `npm run dev` — Development with tsx + Vite HMR
- `npm run build` — Production build (Vite for client, esbuild for server)
- `npm start` — Run production build
- `npm run db:push` — Push Drizzle schema to PostgreSQL

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable, using `pg` (node-postgres) pool

### Key npm Packages
- `drizzle-orm` + `drizzle-kit` — ORM and migration tooling
- `express` — HTTP server
- `@tanstack/react-query` — Client-side data fetching and caching
- `recharts` — Data visualization library
- `framer-motion` — Animation library
- `react-hook-form` + `@hookform/resolvers` — Form handling
- `zod` + `drizzle-zod` — Runtime validation
- `wouter` — Client-side routing
- `csv-parser` — CSV file parsing for data seeding
- `connect-pg-simple` — PostgreSQL session store (available but may not be actively used yet)
- `shadcn/ui` components via numerous `@radix-ui/*` packages

### Fonts (External)
- Google Fonts: Inter, Outfit, DM Sans, Fira Code, Geist Mono, Architects Daughter (loaded via CDN in `index.html` and `index.css`)

### Replit-specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)