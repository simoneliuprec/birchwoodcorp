# API Endpoints

## POST /api/sync

Handles data synchronization operations with support for both initial (full) and delta (incremental) synchronization modes.

### Query Parameters

- `mode` (required): Synchronization mode
  - `init` - Performs full/initial synchronization
  - `delta` - Performs incremental/delta synchronization

### Request

**Method:** POST

**URL Examples:**
```
POST /api/sync?mode=init
POST /api/sync?mode=delta
```

### Response

**Success Response (200 OK):**

For `mode=init`:
```json
{
  "mode": "init",
  "status": "completed",
  "timestamp": "2025-11-13T22:47:21.338Z",
  "recordsProcessed": 0,
  "message": "Initial sync completed successfully (no database configured)"
}
```

For `mode=delta`:
```json
{
  "mode": "delta",
  "status": "completed",
  "timestamp": "2025-11-13T22:47:29.270Z",
  "recordsProcessed": 0,
  "changesApplied": 0,
  "message": "Delta sync completed successfully (no database configured)"
}
```

**Error Responses:**

- **405 Method Not Allowed** - When using HTTP methods other than POST
```json
{
  "error": "Method not allowed",
  "message": "Only POST requests are accepted"
}
```

- **400 Bad Request** - When mode parameter is missing or invalid
```json
{
  "error": "Invalid mode parameter",
  "message": "Mode must be either \"init\" or \"delta\"",
  "received": "invalid_value"
}
```

- **500 Internal Server Error** - When an unexpected error occurs
```json
{
  "error": "Internal server error",
  "message": "Error description",
  "timestamp": "2025-11-13T22:47:29.270Z"
}
```

### Implementation Notes

1. **No Hanging Requests**: The endpoint is designed to always return a response, preventing stuck/hanging requests
2. **Error Handling**: All operations are wrapped in try-catch to handle unexpected errors
3. **Validation**: Input parameters are validated early with immediate error responses
4. **Logging**: All operations are logged to the console for debugging
5. **Database**: Currently no database is configured, so the endpoint returns mock success responses

### Future Enhancements

When a database is added to the project, implement:
- Actual database initialization logic in `mode=init`
- Delta/incremental sync logic in `mode=delta`
- Update response fields (recordsProcessed, changesApplied) with actual values
- Add authentication/authorization if needed
- Add rate limiting if needed

### Testing

You can test the endpoint using curl:

```bash
# Test init mode
curl -X POST "http://localhost:3000/api/sync?mode=init" \
  -H "Content-Type: application/json"

# Test delta mode
curl -X POST "http://localhost:3000/api/sync?mode=delta" \
  -H "Content-Type: application/json"

# Test error cases
curl -X GET "http://localhost:3000/api/sync?mode=init"  # Should return 405
curl -X POST "http://localhost:3000/api/sync?mode=invalid"  # Should return 400
curl -X POST "http://localhost:3000/api/sync"  # Should return 400
```
