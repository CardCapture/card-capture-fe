# Card Capture Frontend

## Quick Commands
- `npm run dev` - Start dev server on http://localhost:3000
- `npm run build` - Production build (run to verify changes compile)
- `npm run test:unit` - Run unit tests (single run)
- `npm test` - Run unit tests in watch mode
- `npm run lint` - ESLint check

## Stack
- React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Path alias: `@/*` maps to `./src/*`
- State: React Query (server state), React Context (client state)
- Routing: React Router DOM v6
- Forms: React Hook Form + Zod validation
- Mobile: Capacitor (iOS/Android)

## Project Structure
- `src/pages/` - Page components (one per route)
- `src/components/` - Reusable UI components
- `src/components/landing/` - Landing page sections (CoordinatorLanding, RecruiterLanding, StudentLanding)
- `src/components/ui/` - shadcn/ui primitives
- `src/api/` - Backend API client functions
- `src/services/` - Business logic services
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions

## Git Workflow
- **Never push directly to `main` or `staging`**
- Create feature branches: `git checkout -b feat/your-description`
- Push your branch and open a PR to `staging`
- PRs trigger unit tests and e2e tests automatically
- Kreg reviews and merges PRs

## For Non-Technical Contributors
If you're new to development, Claude can help you make changes safely. Here's what to know:

- Describe what you want to change in plain English. Claude will find the right files and make edits.
- Always preview changes in the browser (http://localhost:3000) before committing.
- Ask Claude to run `npm run build` to verify your changes compile.
- Ask Claude to run `npm run test:unit` to make sure nothing is broken.
- Common tasks:
  - **Update landing page text/copy**: Look in `src/components/landing/` and `src/pages/HomePage.tsx`
  - **Update page content**: Files in `src/pages/` (e.g., `AboutPage.tsx`, `ContactPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`)
  - **Change button text, labels, headings**: Search for the text you want to change and Claude will find it

## Environment Setup
- Copy `.env.example` to `.env.local` and fill in the values
- For local-only frontend work, `VITE_API_BASE_URL` should point to the staging API (ask Kreg for the URL)
- No need to run the backend locally unless you're doing API work

## Code Style
- TypeScript (not strict null checks, but use types where possible)
- Tailwind for styling, avoid inline style objects
- Use shadcn/ui components from `src/components/ui/` when available
- Never commit `.env` files
