# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep the React app route-driven and state-local, with fetch calls to `/api/*`, and render explicit loading, empty, and error states so the UI reflects real API outcomes rather than hard-coded placeholders.
- Logic tier decision: Centralize validation and business rules in the Express service layer, expose a typed `/api` router, and convert invalid IDs, missing records, and bad payloads into deliberate 4xx responses while leaving the global error handler responsible only for unexpected failures.
- Data tier decision: Use Mongoose schemas with required fields, refs, and defaults as the source of truth; keep seed logic idempotent so it can add demo records without clobbering application-owned data.
- Activity tracking approach: Validate `userId` and `teamId`, reject malformed or missing IDs with 4xx, ensure the saved record stores `user`, `team`, `type`, `minutes`, `points`, and `occurredAt`, and compute points from minutes to match the contract.
- Team management approach: Require a `name` when creating a team, allow `mascot` and `members`, and preserve the submitted member references in the model so list output matches the post payload.
- Leaderboard approach: Aggregate each team’s total activity points, sort descending by score, and assign a 1-based `rank` so client views can render ordered standings without extra client-side sorting.
- Workout suggestions approach: Match a user by email, inspect their activity history and goal, then select a workout whose `focus` aligns with the latest relevant activity and attach a human-readable `reason`.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates Mongoose schema rules and idempotent seed behavior; failures usually mean missing required fields, bad refs, or seed logic that mutates unrelated data.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies the contract for create/list endpoints, 4xx handling, leaderboard totals, and workout recommendation logic; failures typically point to missing service logic or incorrect status codes.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates that route components load real API data, handle empty states, show loading indicators, and surface accessible alert messages; failures usually mean the React UI is still stubbed or not reading the expected payload shapes.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — catches TypeScript and server-side contract issues before merging; a failure usually indicates an invalid type, missing export, or incompatible runtime code path.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — confirms the Vite app compiles cleanly and that the route structure and fetch contracts remain compatible with the current codebase; build failures suggest UI or bundling issues rather than domain logic bugs.
