## Project

Eside

## Version

V1.0 MVP

---

# API Principles

- REST-based API
    
- JSON request/response format
    
- JWT authentication via Supabase
    
- Resource-oriented endpoints
    
- Consistent error handling
    

Base URL:

```text
/api/v1
```

---

# Authentication

Authentication is managed by Supabase.

Frontend receives JWT token.

Protected endpoints require:

```http
Authorization: Bearer <token>
```

---

# Standard Response Format

## Success

```json
{
  "success": true,
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required"
  }
}
```

---

# Experiences API

---

## Create Experience

### Endpoint

```http
POST /api/v1/experiences
```

### Request

```json
{
  "title": "Failed my semester",
  "story": "Long story content...",
  "category_id": "uuid",
  "tags": ["failure", "college"],
  "is_anonymous": true
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

### Validation

- title required
    
- title max 150 chars
    
- story required
    
- category required
    

---

## Get Experience

```http
GET /api/v1/experiences/{id}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Failed my semester",
    "story": "...",
    "author": {
      "username": "RisingPhoenix"
    },
    "category": "Education",
    "tags": [],
    "outcomes": [],
    "comments": []
  }
}
```

---

## Update Experience

```http
PUT /api/v1/experiences/{id}
```

Only owner allowed.

---

## Delete Experience

```http
DELETE /api/v1/experiences/{id}
```

Only owner allowed.

---

## Experience Feed

```http
GET /api/v1/experiences
```

### Query Parameters

```http
?page=1
&limit=20
&sort=latest
&category=education
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1
  }
}
```

---

# Categories API

---

## Get Categories

```http
GET /api/v1/categories
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Education"
    }
  ]
}
```

---

## Get Category Experiences

```http
GET /api/v1/categories/{id}/experiences
```

---

# Comments API

---

## Create Comment

```http
POST /api/v1/comments
```

### Request

```json
{
  "experience_id": "uuid",
  "content": "I experienced something similar."
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

---

## Delete Comment

```http
DELETE /api/v1/comments/{id}
```

Owner only.

---

# Outcomes API

---

## Create Outcome

```http
POST /api/v1/outcomes
```

### Request

```json
{
  "experience_id": "uuid",
  "days_after": 30,
  "content": "Things improved after joining a study group."
}
```

### Validation

Allowed values:

```text
30
90
180
```

---

## Get Outcomes

```http
GET /api/v1/outcomes/{experienceId}
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "days_after": 30,
      "content": "..."
    }
  ]
}
```

---

# Bookmarks API

---

## Save Experience

```http
POST /api/v1/bookmarks
```

### Request

```json
{
  "experience_id": "uuid"
}
```

---

## Remove Bookmark

```http
DELETE /api/v1/bookmarks/{experienceId}
```

---

## Get Bookmarks

```http
GET /api/v1/bookmarks
```

---

# Reports API

---

## Report Experience

```http
POST /api/v1/reports
```

### Request

```json
{
  "experience_id": "uuid",
  "reason": "harassment"
}
```

---

## Report Comment

```http
POST /api/v1/reports
```

### Request

```json
{
  "comment_id": "uuid",
  "reason": "spam"
}
```

---

# Profile API

---

## Get Current User

```http
GET /api/v1/profile
```

---

## Update Profile

```http
PUT /api/v1/profile
```

### Request

```json
{
  "username": "RisingPhoenix",
  "bio": "Learning from life."
}
```

---

# Search API

---

## Search Experiences

```http
GET /api/v1/search
```

### Query

```http
?q=semester failure
```

### Response

```json
{
  "success": true,
  "data": {
    "experiences": []
  }
}
```

---

# Insights API

---

## Platform Insights

```http
GET /api/v1/insights
```

### Response

```json
{
  "success": true,
  "data": {
    "total_experiences": 1000,
    "total_users": 500,
    "total_outcomes": 200
  }
}
```

---

# Error Codes

|Code|Meaning|
|---|---|
|VALIDATION_ERROR|Invalid request|
|UNAUTHORIZED|Login required|
|FORBIDDEN|Permission denied|
|NOT_FOUND|Resource not found|
|RATE_LIMITED|Too many requests|
|SERVER_ERROR|Internal error|

---

# Rate Limiting

## Experience Creation

```text
10 per hour
```

---

## Comments

```text
50 per hour
```

---

## Reports

```text
20 per hour
```

---

# API Success Criteria

The API must support:

1. Authentication
    
2. Experience lifecycle
    
3. Community discussions
    
4. Outcome tracking
    
5. Moderation workflows
    
6. Analytics endpoints
    

while remaining compatible with Supabase Auth and Next.js frontend services.