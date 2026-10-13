<<<<<<< HEAD
# TaskFlow

TaskFlow is a MERN task-management application. Users can register and sign in, then manage their own tasks from a responsive React dashboard. The backend uses JWT authentication and scopes task operations to the signed-in user.

## Features

- User registration and login with normalized email and bcrypt password hashing.
- JWT-based API authentication.
- Create, list, retrieve, update, and delete tasks.
- Task status (`pending`, `in-progress`, `completed`), priority (`low`, `medium`, `high`), description, and optional due date.
- Search by task title or description, filter by status, and paginate task lists.
- Responsive dashboard with loading, empty, and error states.
- Health endpoint at `GET /api/health`.

## Technology

- **Frontend:** React 19, Vite 8, Axios, plain CSS.
- **Backend:** Node.js ES modules, Express 5, Mongoose 9, MongoDB.
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) and `bcryptjs`.
- **Backend support:** `dotenv` for server configuration, `cors` for the frontend origin, and `nodemon` for development.
- **Frontend checks:** Oxlint.

The installed dependencies and scripts are recorded in [server/package.json](server/package.json) and [client/package.json](client/package.json).

## Project structure

```text
TaskFlow/
├── README.md
├── server/
│   ├── config/db.js
│   ├── controllers/          # Authentication and task request handlers
│   ├── middleware/           # JWT authentication
│   ├── models/               # Mongoose User and Task models
│   ├── routes/                # Auth and task API routes
│   ├── tests/                 # Node test-runner validation tests
│   ├── utils/                 # Validation and error helpers
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── client/
    ├── src/
    │   ├── auth/              # Session storage and auth context
    │   ├── components/        # Task dialog
    │   ├── pages/             # Login, registration, and dashboard
    │   ├── services/          # Axios client and task API functions
    │   ├── App.jsx
    │   ├── App.css
    │   └── index.css
    ├── .env.example
    └── package.json
```

## Prerequisites

- Node.js **20.19 or newer in the 20.x line**, or **22.12 or newer in the 22.x line**. These satisfy the installed Vite and Mongoose engine requirements.
- npm.
- A reachable MongoDB deployment, such as MongoDB Atlas, and its database-user credentials.

## Install and configure

Clone the repository, then install each package set:

```sh
cd server
npm install
```

```sh
cd client
npm install
```

Create `server/.env` by copying `server/.env.example`. Replace the placeholders locally:

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long-private-random-secret>
JWT_EXPIRES_IN=1d
```

`MONGODB_URI` must identify the database you intend to use. The server logs the selected database name after connecting; when the URI has no database path and no `dbName` option is supplied, the MongoDB driver defaults to `test`.

The client can use the defaults in `client/.env.example` without a local environment file. To override the API URL, create `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Vite environment variables are public to browser code. Only put non-secret configuration such as the API base URL in the client environment; never put database credentials or `JWT_SECRET` there.

## Run locally

Start the backend in one terminal:

```sh
cd server
npm run dev
```

For a normal backend start, use `npm start` from `server/`.

Start the frontend in a second terminal:

```sh
cd client
npm run dev
```

Vite prints the frontend URL (normally `http://localhost:5173`). The backend defaults to `http://localhost:5000`. If Vite chooses a different port, update `CLIENT_URL` in `server/.env` to match and restart the backend.

## API

The API base path is `/api`. Successful API responses use JSON. Errors generally use `{ "success": false, "message": "..." }`.

### Health

| Method | Route | Response |
| --- | --- | --- |
| GET | `/api/health` | `200`, `{ "status": "ok", "message": "TaskFlow API is healthy." }` |

### Authentication

| Method | Route | Request body | Success |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ "name": "Alex Morgan", "email": "alex@example.com", "password": "StrongPass1" }` | `201`, `{ "success": true, "user": { "id", "name", "email", "createdAt", "updatedAt" } }` |
| POST | `/api/auth/login` | `{ "email": "alex@example.com", "password": "StrongPass1" }` | `200`, `{ "success": true, "token": "<JWT>", "user": { "id", "name", "email", "createdAt", "updatedAt" } }` |

Registration requires a valid email and a password of at least eight characters containing uppercase, lowercase, and numeric characters. Duplicate email returns `409`; invalid input returns `400`. Invalid login credentials return the generic `401` response `Invalid email or password.` The password hash is not returned.

Use the login token on task requests:

```http
Authorization: Bearer <JWT>
```

### Tasks

Every task route requires a valid Bearer token. The server derives ownership from the JWT; clients must not send or set an owner ID.

| Method | Route | Purpose | Success |
| --- | --- | --- | --- |
| POST | `/api/tasks` | Create a task | `201`, `{ "success": true, "task": { ... } }` |
| GET | `/api/tasks` | List the signed-in user's tasks | `200`, `{ "success": true, "tasks": [...], "pagination": {...} }` |
| GET | `/api/tasks/:id` | Retrieve one owned task | `200`, `{ "success": true, "task": { ... } }` |
| PATCH | `/api/tasks/:id` | Partially update an owned task | `200`, `{ "success": true, "task": { ... } }` |
| DELETE | `/api/tasks/:id` | Delete an owned task | `200`, `{ "success": true, "message": "Task deleted." }` |

Create request example:

```json
{
  "title": "Prepare launch checklist",
  "description": "Review the release steps",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-12-31"
}
```

`title` is required (1–120 characters). `description` is optional (up to 5000 characters). `status` defaults to `pending`; allowed values are `pending`, `in-progress`, and `completed`. `priority` defaults to `medium`; allowed values are `low`, `medium`, and `high`. `dueDate` is optional and accepts an ISO date/date-time string or `null`. Omitted ownership is assigned from the authenticated JWT.

PATCH accepts any non-empty subset of `title`, `description`, `status`, `priority`, and `dueDate`; set `dueDate` to `null` to clear it. Unknown fields, including owner fields, are rejected.

List query parameters:

| Parameter | Default | Behavior |
| --- | --- | --- |
| `page` | `1` | Positive, one-based page number |
| `limit` | `10` | Positive page size, capped at `100` |
| `status` | omitted | Optional status filter using the allowed status values |
| `search` | omitted | Case-insensitive match against title or description; maximum 100 characters |

Pagination response metadata includes `page`, `limit`, `total`, and `totalPages`. A task that does not exist or belongs to another user returns `404`. Missing/invalid tokens return `401`; invalid input or task IDs return `400`; database service failures may return `503`.

## Checks

Run these from the relevant application directory:

```sh
cd server
npm test
```

The backend tests use Node's built-in test runner and cover task input and list-query validation. They are **unit tests**, not database-backed API integration tests and not a full authorization penetration test.

```sh
cd client
npm run lint
npm run build
```

For a manual security check, obtain separate user tokens, create a task with one user, and try to retrieve, patch, or delete its ID using the other user's token. The API should return `404`. Also try a task request without a token (expected `401`) and include a `user` field in a task body (expected `400`). These are manual checks, not automated tests in this repository.

## Security

- Never commit `.env` files. The server ignores `.env`; use the example files as templates only.
- Never expose MongoDB credentials or `JWT_SECRET` in frontend code, client environment variables, logs, or source control.
- Passwords are hashed with bcryptjs and excluded from normal user queries/responses.
- Task routes require JWT authentication and all task database queries are scoped to the authenticated user's ID. Client-side route protection is only a UI convenience; the API enforces authorization.
- The frontend stores its JWT in browser localStorage. XSS could expose that token, so use standard frontend XSS protections and keep server-side JWT verification in place.

## Troubleshooting

- **MongoDB connection fails:** verify the URI, database username/password, Atlas network access/IP allowlist, and that the URI includes the intended database name. The backend prints the connected database name without printing the URI.
- **Tasks appear in a different Atlas database:** check the database name printed by the backend. A URI without a database path uses the driver's `test` default. The Task collection is named `tasks`.
- **Frontend cannot reach the API:** check that the backend is running on port 5000, `VITE_API_URL` ends in `/api`, and `CLIENT_URL` matches the Vite origin. Restart Vite after changing client environment variables.
- **401 responses:** sign in again and confirm the task request includes `Authorization: Bearer <JWT>`.
=======
# Task-Flow
>>>>>>> origin/main
