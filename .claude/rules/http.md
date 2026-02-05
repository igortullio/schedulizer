# REST/HTTP

## REST Conventions

### Resource Naming

- Resources in English and plural
- Use kebab-case for compound resources and verbs

```typescript
// ✅ Prefer
GET /users
GET /users/:userId
GET /scheduled-events
GET /playlists/:playlistId/videos

// ❌ Avoid
GET /getUsers
GET /user/:userId (singular)
GET /scheduledEvents (camelCase)
```

### Resource Depth

Avoid endpoints with more than 3 resources

```typescript
// ❌ Avoid - too deep
GET /channels/:channelId/playlists/:playlistId/videos/:videoId/comments

// ✅ Prefer - flatter
GET /videos/:videoId/comments
GET /comments?videoId=:videoId
```

### Mutations and Actions

For mutations, use REST to navigate resources and verbs to represent actions (always POST)

```typescript
// ✅ Prefer - verbs for specific actions
POST /users/:userId/change-password
POST /orders/:orderId/cancel
POST /invoices/:invoiceId/send-reminder

// ✅ PUT is appropriate for full resource replacement
PUT /users/:userId
```

## HTTP Status Codes

| Code | When to use |
|------|-------------|
| 200 | Request successful |
| 201 | Resource created |
| 204 | Deleted successfully (no content) |
| 400 | Malformed request (validation error) |
| 401 | Not authenticated |
| 403 | Not authorized (authenticated but no permission) |
| 404 | Resource not found |
| 422 | Business logic error |
| 500 | Unexpected server error |

## Route

- Create at `apps/api/src/routes/<name>.routes.ts`
- Register in `apps/api/src/index.ts`

## Standards

- Always validate input with Zod
- Filter by organizationId for multi-tenancy
- Return consistent format: `{ data: ... }` or `{ error: ... }`
- Use middleware for authentication and cross-cutting concerns
