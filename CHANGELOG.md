# Changelog

All notable changes to EduFlow LMS.

## [1.0.0] - 2026-08-01

### Added
- Admin module: full CRUD management for students, mentors, batches (with
  student assignment), courses (with module/lesson manager), assignments,
  announcements, attendance, activity logs, and app settings.
- Shared admin UI infrastructure: paginated `useListData` hook, `StatusBadge`
  component, and domain types.
- Backend admin REST API supporting the admin pages.
- Production deployment setup:
  - `render.yaml` blueprint (Render web service, free plan).
  - Same-origin-aware CORS handling and static/SPA serving of the built React
    app from the Express API in production (`backend/src/app.ts`).
  - Root `start` and `postinstall` (Prisma generate) scripts.
  - `.env.example` documenting all environment variables.
  - `README.md` with local dev + Render/Atlas deploy instructions.

### Changed
- Fixed admin announcements listing returning an empty result when no
  `target` query is supplied.
- Replaced the fixed-origin CORS middleware with a middleware that also allows
  same-origin requests (required for same-origin production hosting).

### Fixed
- Backend: announcements service early-return for admin listing.
- Backend: health check route was mounted as `/api/health/health`; now served
  at `/api/health` (used by Render's health check).
- Backend: `tsconfig.json` `rootDir`/`include` produced output at
  `dist/src/index.js`, breaking `npm run start` (`node dist/index.js`); the
  build now emits to `dist/index.js` as the `start`/`main` paths expect.
