
# Bookmark Manager — Implementation Walkthrough

## What I Built

I built a Bookmark Manager GraphQL API that allows bookmarks to be organized into folders and managed through a GraphQL API.

The implementation uses:

- **Bun** for the runtime and package management
- **TypeScript** with strict mode
- **GraphQL Yoga** using a schema-first approach
- **PostgreSQL** for persistence
- **Prisma** for database access and migrations
- **Docker Compose** for the local PostgreSQL environment

The API supports folder management, bookmark management, searching by bookmark title, filtering by folder, nested folder/bookmark queries, and cursor-based pagination.

---

## Project Structure

```text
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
````

The GraphQL schema is kept separately in `schema.graphql`, while the resolver implementation is in `resolvers.ts`.

---

## Key Design Decisions

### 1. Folder and Bookmark relationship

A bookmark belongs to a folder through `folderId`.

The domain models contain the required fields such as IDs, names/titles, URLs, tags, and creation timestamps.

This relationship directly represents the main requirement of the assignment: organizing bookmarks into folders and allowing a folder to expose its nested bookmarks.

### 2. Prisma for database access and migrations

I used Prisma as the database ORM and migration tool instead of manually managing SQL migrations.

The schema is defined in `prisma/schema.prisma`, and the project includes a generated Prisma migration.

This keeps the database model and application data-access layer aligned while satisfying the assignment's requirement to use proper Prisma migrations.

### 3. Schema-first GraphQL

GraphQL Yoga is configured with a `.graphql` schema file and separate TypeScript resolvers.

This was chosen because the assignment explicitly requires a schema-first GraphQL implementation. It also keeps the API contract separate from the resolver implementation.

### 4. Input validation in resolvers

Validation is performed at the mutation boundary before data is written to PostgreSQL.

For example, bookmark titles are trimmed and rejected when empty or whitespace-only. Bookmark URLs are parsed using JavaScript's `URL` API and restricted to `http:` and `https:` protocols.

Validation errors and resource-not-found cases are surfaced through structured GraphQL errors with meaningful codes such as `INVALID_INPUT` and `NOT_FOUND`.

This prevents invalid input and expected application errors from becoming generic internal server errors.

### 5. Cursor-based pagination

The `bookmarks` query supports:

```graphql
take
cursor
```

Bookmarks are ordered using:

```text
createdAt ASC
id ASC
```

The `id` provides a tiebreaker when timestamps are equal.

For a subsequent page, the previous page's last bookmark ID is supplied as the cursor, and the resolver uses Prisma's cursor support with `skip: 1` so that the cursor record itself is not returned again.

This provides stable pagination across multiple requests rather than simply returning a fixed subset of records.

### 6. Filtering and search

The `bookmarks` query supports optional `folderId` and `search` arguments.

Folder filtering is applied through `folderId`, while title search uses Prisma's `contains` filtering with case-insensitive matching.

This directly maps the GraphQL query arguments to the requested assignment behavior without introducing a separate search system.

---

## Tradeoffs

I intentionally kept the implementation within the assignment's requested scope.

The following were not implemented:

* Authentication
* Authorization
* Redis or caching infrastructure
* Kafka or messaging infrastructure
* Microservices
* API deployment infrastructure
* Full-text search
* Rate limiting
* Dockerfile

These were intentionally left out because they are not required for the assignment. The specification specifically emphasizes a clean, maintainable solution without over-engineering.

GitHub Actions was implemented as an optional bonus, while the optional sanity script and Dockerfile were not added.

---

## Testing

The test suite is run with:

```bash
bun test
```

The current test output is:

```text
11 pass
0 fail
39 expect() calls
Ran 11 tests across 2 files.
```

The tests cover important resolver behavior including bookmark creation, update, deletion, moving bookmarks, validation/error paths, and cursor pagination.

The project also contains a real PostgreSQL integration test under:

```text
tests/integration/postgres.test.ts
```

This verifies interaction with the PostgreSQL database rather than relying entirely on mocked database calls.

I also verified the TypeScript project with:

```bash
bun run typecheck
```

with no TypeScript errors.

---

## What I'd Improve With More Time

These are future improvements and are **not currently implemented**:

* **Authentication and authorization** — associate bookmarks and folders with users and control access.
* **Better search** — replace simple substring matching with PostgreSQL full-text search if search requirements grow.
* **Caching** — reduce database load for frequently accessed data.
* **Observability** — add structured logging, metrics, and tracing.
* **API versioning/schema evolution** — provide a controlled approach for future API changes.
* **Scaling** — consider connection pooling, read replicas, and horizontal API scaling as usage increases.

The current implementation intentionally stays focused on the requirements of the take-home assignment.

```
```
