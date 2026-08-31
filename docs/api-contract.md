# Eside — API Contract Specification

## Version
`v1.0.0 (MVP)`

## Base URL
```text
/api/v1
```

---

## 1. Global Standard Formats

### Standard Success Envelope
All successful responses return HTTP `200` (or `201 Created`) with a standard JSON envelope:
```json
{
  "success": true,
  "data": {}
}
```

### Standard Error Envelope
All error responses return the appropriate HTTP status code (`400`, `401`, `403`, `404`, `429`, `500`) with a standardized error object:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be between 3 and 150 characters."
  }
}
```

### Global Error Code Dictionary
| Error Code | HTTP Status | Meaning |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | `400 Bad Request` | Request payload failed schema validation constraints |
| `UNAUTHORIZED` | `401 Unauthorized` | Missing, expired, or invalid Supabase JWT session |
| `FORBIDDEN` | `403 Forbidden` | Authenticated user lacks permission for the resource |
| `NOT_FOUND` | `404 Not Found` | Requested entity does not exist or has been soft-deleted |
| `CONFLICT` | `409 Conflict` | Unique resource collision (e.g., username already taken) |
| `RATE_LIMITED` | `429 Too Many Requests` | Request rate threshold exceeded |
| `SERVER_ERROR` | `500 Internal Server Error` | Unhandled database or backend execution exception |

---

## 2. API Endpoints Contract

---

### `POST /api/v1/auth/register`
Registers a new anonymous user account with Supabase Auth and provisions `public.users`.

- **Auth Required**: No (Public)
- **Rate Limit**: 10 requests / hour per IP

#### Request
```http
POST /api/v1/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "RisingPhoenix",
  "bio": "Learning from life lessons."
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Valid RFC 5322 email address |
| `password` | `string` | **Yes** | Min 8 characters, at least 1 number and 1 special character |
| `username` | `string` | **Yes** | 3–30 characters, regex `^[a-zA-Z0-9_]{3,30}$`, case-insensitive unique |
| `bio` | `string` | No | Max 300 characters |

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c1f72a4e-8390-4e3a-b8b2-4d2c8e31a100",
      "email": "user@example.com",
      "username": "RisingPhoenix"
    },
    "session": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "v1.eyJ..."
    }
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Invalid email, password strength, or username regex.
- `409 CONFLICT`: Username or email is already registered.

---

### `POST /api/v1/auth/login`
Authenticates an existing user and returns a fresh session JWT.

- **Auth Required**: No (Public)
- **Rate Limit**: 20 requests / hour per IP

#### Request
```http
POST /api/v1/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Valid email format |
| `password` | `string` | **Yes** | Non-empty string |

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c1f72a4e-8390-4e3a-b8b2-4d2c8e31a100",
      "email": "user@example.com",
      "username": "RisingPhoenix"
    },
    "session": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "v1.eyJ..."
    }
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Missing email or password fields.
- `401 UNAUTHORIZED`: Invalid email or password credentials.

---

### `POST /api/v1/experiences`
Creates a new lived experience entry linked to the authenticated user.

- **Auth Required**: **Yes** (`Bearer <token>` or session cookie)
- **Rate Limit**: 10 posts / hour per user

#### Request
```http
POST /api/v1/experiences HTTP/1.1
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "title": "Failed my first college semester",
  "story": "During my first semester of computer engineering, I struggled with time management and failed two core subjects. Here is how I restructured my routine...",
  "category_id": "a3b8d4e2-9f1c-4b5a-8e2d-3c4b5a6f7e8d",
  "tags": ["failure", "college", "recovery"],
  "is_anonymous": true
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Yes** | 3–150 characters, trimmed |
| `story` | `string` | **Yes** | Min 10 characters, max 10,000 characters |
| `category_id` | `string (UUID)` | **Yes** | Must exist in `categories` table |
| `tags` | `string[]` | No | Max 5 tags, each 2–30 chars |
| `is_anonymous` | `boolean` | No | Default `true` |

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "f8a12b34-5678-49ab-9012-3456789abcde",
    "title": "Failed my first college semester",
    "status": "active",
    "created_at": "2026-08-31T11:00:00.000Z"
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Title too short, story missing, or invalid UUID.
- `401 UNAUTHORIZED`: Unauthenticated request.

---

### `GET /api/v1/experiences`
Returns a paginated list of active, non-deleted experiences for the public feed.

- **Auth Required**: No (Public)
- **Rate Limit**: 100 requests / minute

#### Request
```http
GET /api/v1/experiences?page=1&limit=20&category=education&sort=latest HTTP/1.1
```

#### Query Parameters
| Parameter | Type | Required | Default | Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | Min `1` |
| `limit` | `integer` | No | `20` | Min `1`, Max `50` |
| `category` | `string` | No | `null` | Category slug or UUID |
| `tag` | `string` | No | `null` | Tag name filter |
| `sort` | `string` | No | `'latest'` | `'latest'` \| `'outcomes'` |

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "f8a12b34-5678-49ab-9012-3456789abcde",
        "title": "Failed my first college semester",
        "story_preview": "During my first semester of computer engineering, I struggled with...",
        "is_anonymous": true,
        "author": {
          "username": "RisingPhoenix"
        },
        "category": {
          "id": "a3b8d4e2-9f1c-4b5a-8e2d-3c4b5a6f7e8d",
          "name": "Education"
        },
        "tags": ["failure", "college", "recovery"],
        "outcomes_count": 2,
        "comments_count": 5,
        "created_at": "2026-08-31T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 142,
      "total_pages": 8
    }
  }
}
```

---

### `GET /api/v1/experiences/:id`
Retrieves full experience details, complete story, outcome milestones timeline, and comments.

- **Auth Required**: No (Public, or authenticated to view owned drafts)
- **Rate Limit**: 120 requests / minute

#### Request
```http
GET /api/v1/experiences/f8a12b34-5678-49ab-9012-3456789abcde HTTP/1.1
```

#### Validation Rules
| Parameter | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string (UUID)` | **Yes** | Must be a valid UUIDv4 format |

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "f8a12b34-5678-49ab-9012-3456789abcde",
    "title": "Failed my first college semester",
    "story": "During my first semester of computer engineering, I struggled with time management and failed two core subjects...",
    "is_anonymous": true,
    "status": "active",
    "author": {
      "id": "c1f72a4e-8390-4e3a-b8b2-4d2c8e31a100",
      "username": "RisingPhoenix"
    },
    "category": {
      "id": "a3b8d4e2-9f1c-4b5a-8e2d-3c4b5a6f7e8d",
      "name": "Education"
    },
    "tags": ["failure", "college", "recovery"],
    "outcomes": [
      {
        "id": "90e12345-6789-4abc-def0-1234567890ab",
        "days_after": 30,
        "content": "Formed a study group and retook introductory labs.",
        "created_at": "2026-09-30T11:00:00.000Z"
      }
    ],
    "comments": [
      {
        "id": "12e34567-89ab-4cde-f012-3456789abcde",
        "content": "Thank you for sharing this. Went through the exact same struggle in engineering.",
        "author": {
          "username": "SilentLearner"
        },
        "created_at": "2026-08-31T12:00:00.000Z"
      }
    ],
    "created_at": "2026-08-31T11:00:00.000Z",
    "updated_at": "2026-08-31T11:00:00.000Z"
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Invalid UUID format.
- `404 NOT_FOUND`: Experience does not exist or has `status = 'deleted'`.

---

### `POST /api/v1/comments`
Posts a comment in response to an experience.

- **Auth Required**: **Yes** (`Bearer <token>` or session cookie)
- **Rate Limit**: 50 comments / hour per user

#### Request
```http
POST /api/v1/comments HTTP/1.1
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
  "content": "Thank you for sharing this. Went through the exact same struggle in engineering."
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `experience_id` | `string (UUID)` | **Yes** | Valid active experience ID |
| `content` | `string` | **Yes** | 1–3000 characters, non-whitespace |

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "12e34567-89ab-4cde-f012-3456789abcde",
    "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
    "content": "Thank you for sharing this. Went through the exact same struggle in engineering.",
    "created_at": "2026-08-31T12:00:00.000Z"
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Empty content or invalid UUID.
- `401 UNAUTHORIZED`: Authentication required.
- `404 NOT_FOUND`: Target experience does not exist.

---

### `POST /api/v1/outcomes`
Adds a long-term milestone update (Day 30, 90, or 180) to an experience. Only the experience owner can post outcomes.

- **Auth Required**: **Yes** (Owner verification required)
- **Rate Limit**: 20 requests / hour

#### Request
```http
POST /api/v1/outcomes HTTP/1.1
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
  "days_after": 30,
  "content": "Formed a study group, attended office hours weekly, and cleared my probation."
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `experience_id` | `string (UUID)` | **Yes** | Must belong to authenticated user |
| `days_after` | `integer` | **Yes** | Must be strictly one of `[30, 90, 180]` |
| `content` | `string` | **Yes** | 5–3000 characters |

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "90e12345-6789-4abc-def0-1234567890ab",
    "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
    "days_after": 30,
    "content": "Formed a study group, attended office hours weekly, and cleared my probation.",
    "created_at": "2026-09-30T11:00:00.000Z"
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: `days_after` not in `(30, 90, 180)` or content too short.
- `401 UNAUTHORIZED`: Authentication missing.
- `403 FORBIDDEN`: Authenticated user is not the owner of the experience.
- `409 CONFLICT`: Outcome update for this `days_after` milestone already exists on this experience.

---

### `POST /api/v1/bookmarks`
Saves an experience to the user's private bookmarks list.

- **Auth Required**: **Yes**
- **Rate Limit**: 60 requests / hour

#### Request
```http
POST /api/v1/bookmarks HTTP/1.1
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde"
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `experience_id` | `string (UUID)` | **Yes** | Valid active experience UUID |

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "user_id": "c1f72a4e-8390-4e3a-b8b2-4d2c8e31a100",
    "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
    "created_at": "2026-08-31T12:30:00.000Z"
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Invalid UUID.
- `401 UNAUTHORIZED`: Authentication required.
- `409 CONFLICT`: Experience is already bookmarked by the user.

---

### `POST /api/v1/reports`
Submits a moderation report against an experience or a comment. Exactly one target ID must be provided.

- **Auth Required**: **Yes**
- **Rate Limit**: 20 reports / hour per user

#### Request
```http
POST /api/v1/reports HTTP/1.1
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
  "reason": "harassment"
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `experience_id` | `string (UUID)` | Conditional | Required if `comment_id` is null |
| `comment_id` | `string (UUID)` | Conditional | Required if `experience_id` is null |
| `reason` | `string` | **Yes** | Must be one of: `['spam', 'harassment', 'hate_speech', 'misinformation', 'threats', 'privacy_violation', 'other']` |

*Target Constraint*: Exactly one of `experience_id` or `comment_id` must be provided; sending both or neither triggers a validation error.

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "78a90123-4567-489a-bcde-f0123456789a",
    "status": "pending",
    "created_at": "2026-08-31T12:45:00.000Z"
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Invalid reason code, or both/neither targets specified.
- `401 UNAUTHORIZED`: Authentication required.
- `404 NOT_FOUND`: Target experience or comment does not exist.
