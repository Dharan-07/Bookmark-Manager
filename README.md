
# Bookmark Manager GraphQL API

## 1. Overview

This project is a GraphQL API for managing bookmarks organized into folders. It allows creating, updating, deleting, and moving bookmarks between folders, along with searching and paginating through bookmark lists.

Built with:
- **Bun** — JavaScript/TypeScript runtime and package manager
- **TypeScript** (strict mode) — application language
- **GraphQL Yoga** — GraphQL server, schema-first approach
- **Prisma** — ORM and database migrations
- **PostgreSQL** — database
- **Docker Compose** — local PostgreSQL environment

## 2. Features

- Folder management (create, list, fetch by ID with nested bookmarks)
- Bookmark management (create, update, delete, move between folders)
- Bookmark search by title (substring match)
- Bookmark filtering by folder
- Nested folder → bookmarks query
- Cursor-based pagination for bookmarks
- Input validation (empty/whitespace titles, invalid URLs)
- Structured GraphQL error handling with meaningful error codes
- PostgreSQL persistence via Prisma

## 3. Tech Stack

| Technology | Purpose |
|---|---|
| Bun | Runtime and package manager |
| TypeScript | Application language |
| GraphQL Yoga | GraphQL server |
| PostgreSQL | Database |
| Prisma | ORM and migrations |
| Docker Compose | Local PostgreSQL |

## 4. Project Structure

```
bookmark-manager/
├── .env.example
├── docker-compose.yml
├── package.json
├── prisma.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20260821102818_init/
│           └── migration.sql
├── src/
│   ├── server.ts
│   ├── sanity.ts
│   ├── db/
│   │   └── prisma.ts
│   └── graphql/
│       ├── errors.ts
│       ├── resolvers.ts
│       ├── resolvers.test.ts
│       └── schema.graphql
└── tests/
    └── integration/
        └── postgres.test.ts
```

## 5. Requirements

- [Bun](https://bun.sh) (v1.4.0 or later)
- [Docker](https://www.docker.com/) with Docker Compose
- PostgreSQL is provided via Docker Compose — no local PostgreSQL installation is required

## 6. Setup

Clone the repository and set up the environment:

```bash
git clone <repository-url>
cd bookmark-manager

# start PostgreSQL
docker compose up -d

# install dependencies
bun install

# copy environment variables and fill in your own password
cp .env.example .env

# apply database migrations
bunx prisma migrate dev

# start the development server
bun run dev
```

There is currently no `gendb` script; database setup is done directly via `bunx prisma migrate dev`, which applies the existing Prisma migrations to your PostgreSQL container.

### `.env` and `.env.example`

`.env.example` documents the required environment variables without real secrets. Copy it to `.env` and fill in your own values — `.env` is excluded from version control via `.gitignore`.

## 7. Environment Variables

```env
POSTGRES_PASSWORD=YOUR_PASSWORD
DATABASE_URL=postgresql://bookmark_user:YOUR_PASSWORD@localhost:5432/bookmark_db
```

- `POSTGRES_PASSWORD` — password for the PostgreSQL user, used by the Docker Compose Postgres container
- `DATABASE_URL` — full connection string used by Prisma (both the CLI, via `prisma.config.ts`, and the application's database client) to connect to PostgreSQL

## 8. Database

PostgreSQL runs locally via Docker Compose (`docker-compose.yml`). The database schema is defined and managed entirely through Prisma:

- Schema definition: `prisma/schema.prisma`
- Migrations: `prisma/migrations/` — generated using Prisma's migration tooling (`prisma migrate dev`), not written or edited by hand
- Prisma Client is generated from the schema and used by the application to query the database

To apply migrations to a fresh database:

```bash
bunx prisma migrate dev
```

## 9. Running the Server

```bash
bun run dev
```

This starts the GraphQL Yoga server with file watching enabled. On startup, the server logs the local GraphQL endpoint URL to the console.

## 10. GraphQL API

### Queries

```graphql
folders: [Folder!]!
folder(id: ID!): Folder
bookmarks(folderId: ID, search: String, take: Int, cursor: ID): [Bookmark!]!
```

- `folders` — returns all folders
- `folder(id)` — returns a single folder along with its nested bookmarks
- `bookmarks` — returns bookmarks, optionally filtered by `folderId`, filtered by a `search` substring match on the title, and paginated using `take`/`cursor`

### Mutations

```graphql
createFolder(name: String!): Folder!
createBookmark(title: String!, url: String!, tags: [String!], folderId: ID!): Bookmark!
updateBookmark(id: ID!, title: String, url: String, tags: [String!]): Bookmark!
deleteBookmark(id: ID!): Boolean!
moveBookmark(id: ID!, folderId: ID!): Bookmark!
```

- `createFolder` — creates a new folder
- `createBookmark` — creates a new bookmark inside a folder
- `updateBookmark` — updates a bookmark's title, url, and/or tags
- `deleteBookmark` — deletes a bookmark by ID
- `moveBookmark` — moves an existing bookmark to a different folder

## 11. Pagination

The `bookmarks` query supports cursor-based pagination using `take` and `cursor`:

- `take` — the maximum number of bookmarks to return
- `cursor` — the ID of the last bookmark from the previous page; results are returned starting immediately after that record

Bookmarks are ordered by `createdAt` with `id` as a tiebreaker, ensuring a stable, consistent order across multiple paginated requests, even when multiple bookmarks share the same timestamp.

## 12. Validation and Errors

- Bookmark titles cannot be empty or whitespace-only (`INVALID_INPUT`)
- Bookmark URLs must be valid; malformed URLs are rejected (`INVALID_INPUT`)
- Operations on a non-existent bookmark return a `NOT_FOUND` GraphQL error
- Moving a bookmark to a non-existent folder returns a `NOT_FOUND` GraphQL error
- Errors are returned as structured GraphQL errors with meaningful `message` and `extensions.code` values, rather than unhandled exceptions or generic 500 responses

## 13. Testing

Run the full test suite with:

```bash
bun test
```

Current test results:

```text
11 pass
0 fail
39 expect() calls
Ran 11 tests across 2 files.
```

The test suite includes:
- Resolver/unit tests covering bookmark creation, update, deletion, and move operations
- Validation and error-path tests (empty titles, invalid URLs, not-found cases)
- A cursor pagination test
- A real PostgreSQL integration test that creates and reads data from the running database

## 14. Git History

Development was done through incremental commits with meaningful messages, tracking each feature (folder/bookmark queries, mutations, pagination, validation, error handling, tests, documentation) as it was added.

## 15. How I'd Extend This

With more time, areas I'd look at include:

- **Authentication** — identifying API consumers
- **Authorization** — restricting access to folders/bookmarks per user
- **Better search** — full-text search instead of simple substring matching
- **Caching** — reducing database load for frequently accessed queries
- **Observability** — structured logging, metrics, tracing
- **API versioning** — supporting schema evolution without breaking existing clients
- **Scaling** — connection pooling, read replicas, horizontal scaling of the API layer

None of the above are currently implemented; they are intentionally out of scope for this assignment.

## 16. Known Limitations / Future Improvements

- No authentication or authorization — the API is currently open
- Search is a simple substring match on bookmark titles, not full-text search
- No rate limiting or request throttling

## 17. Project Status

```text
Implemented:
- GraphQL API (Yoga, schema-first)
- PostgreSQL + Prisma with migrations
- Folder and bookmark queries, including nested folder → bookmarks
- Bookmark search and folder filtering
- Cursor-based pagination
- Input validation and structured GraphQL errors
- Resolver/unit tests
- PostgreSQL integration test

Remaining:
- Optional bonus features (sanity script, Dockerfile, GitHub Actions)
```
```
