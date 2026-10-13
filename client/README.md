# TaskFlow frontend

The TaskFlow frontend is a responsive React application built with Vite. It provides registration and login screens, a protected dashboard, and task management tools backed by the TaskFlow Express API.

## Features

- Register and sign in through the backend authentication API.
- Restore the saved session on refresh; log out to clear it.
- Create, edit, and delete tasks, and change task status.
- Search task titles/descriptions, filter by status, and move between result pages.
- Show priority, due dates, loading feedback, empty states, and API errors.

## Structure

```text
src/
├── auth/
│   ├── AuthContext.jsx      # Current user and login/logout actions
│   ├── authContext.js       # Auth context hook
│   └── session.js           # Browser session storage and expiry checks
├── components/
│   └── TaskDialog.jsx       # Create/edit task form
├── pages/
│   ├── AuthPage.jsx         # Login and registration forms
│   └── DashboardPage.jsx   # Task list, filters, actions, and pagination
├── services/
│   ├── api.js               # Shared Axios instance and bearer token handling
│   └── tasks.js             # Task API functions
├── App.jsx                  # Login, registration, and dashboard route selection
├── App.css                  # Application and responsive styles
└── index.css                # Global styles
```

## Requirements and installation

Use Node.js **20.19 or newer in the 20.x line**, or **22.12 or newer in the 22.x line**, plus npm. From this directory run:

```sh
npm install
```

The Vite server can be started without a local environment file. To override the API address, copy `.env.example` to `.env` and set:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

`VITE_API_URL` defaults to `http://localhost:5000/api`. Client environment variables are included in browser code; do not put MongoDB credentials or JWT signing secrets in them.

## Commands

Start the frontend development server:

```sh
npm run dev
```

Run Oxlint:

```sh
npm run lint
```

Create a production bundle in `dist/`:

```sh
npm run build
```

To preview a built bundle locally, first run `npm run build`, then:

```sh
npm run preview
```

## Authentication and API behavior

The app sends requests through the shared Axios instance in `src/services/api.js`. It uses `VITE_API_URL` as its base URL and adds the saved JWT as `Authorization: Bearer <token>` when present. Authentication calls use `/auth/register` and `/auth/login`; task calls are defined in `src/services/tasks.js` and use `/tasks` endpoints.

After login, the frontend stores the returned token and safe user object in localStorage. It never stores the password. The session utility checks token expiry when restoring a session, and a `401` response clears the session. Logout also clears the stored session. The dashboard redirects unauthenticated users to login, but this frontend route check is not security enforcement; the backend validates JWTs and task ownership on each protected API request.

The backend must be running, normally at `http://localhost:5000`, and its `CLIENT_URL` must match the Vite origin (normally `http://localhost:5173`). See the [root README](../README.md) for backend setup and API details.

## Troubleshooting

- **Network error or no API response:** start the backend and check that `VITE_API_URL` points to the API base path, including `/api`.
- **CORS error:** set the server's `CLIENT_URL` to the exact frontend origin shown by Vite, then restart the backend.
- **401 response or redirect to login:** sign in again; the session may be absent or the JWT may have expired.
- **Environment change has no effect:** restart the Vite development server after editing `.env`.
- **Install/build errors:** use a supported Node version and run `npm install` from `client/` before linting or building.
