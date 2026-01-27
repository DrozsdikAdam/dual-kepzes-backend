# API Pagination & Response Structure Documentation

This document describes the changes made to the API list endpoints as of the Phase 3 refactor.

## New Response Format

All list (GET) endpoints now return a standardized JSON object instead of a direct array.

### Example Response
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Item Name", ... },
    { "id": "uuid", "name": "Another Item", ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

- **`success`**: Boolean indicating the operational success.
- **`data`**: Array containing the requested entities (mapped through standard mappers).
- **`pagination`**: 
    - `page`: Current page number (1-based).
    - `limit`: Number of items per page.
    - `total`: Total number of records matching the query in the database.
    - `totalPages`: Total number of available pages.

## Query Parameters

The following optional query parameters can be used on all affected endpoints:

| Parameter | Type    | Default | Description |
|-----------|---------|---------|-------------|
| `page`    | Number  | 1       | The page number to retrieve. |
| `limit`   | Number  | 10      | Number of items per page. |

## Request Examples

The parameters are passed as standard URL query strings:

- **Basic request (default 10 items):**
  `GET /api/jobs`

- **Requesting a specific page:**
  `GET /api/jobs?page=2`

- **Customizing the number of items per page:**
  `GET /api/jobs?limit=25`

- **Combining parameters (Page 3, 20 items per page):**
  `GET /api/jobs?page=3&limit=20`

---

## Affected Endpoints

The following endpoints have been updated to use this new structure:

### Jobs & News
- `GET /api/jobs`
- `GET /api/news`

### User Management
- `GET /api/students`
- `GET /api/system-admins`
- `GET /api/company-admins`
- `GET /api/university-users`
- `GET /api/system-admins/all-admins`
- `GET /api/users/inactive` (Inactivated/Soft-deleted users)

### Company & Employees
- `GET /api/companies`
- `GET /api/companies/inactive`
- `GET /api/employees/company/:companyId`
- `GET /api/employees/mentors/:companyId`

### Applications
- `GET /api/applications/my` (Student's own applications)
- `GET /api/applications/company` (Company's incoming applications)
- `GET /api/applications` (System admin view)

### Dual Partnerships
- `GET /api/partnerships/student`
- `GET /api/partnerships/company`
- `GET /api/partnerships/university`

## Input Sanitization
**Note**: All `POST`, `PUT`, and `PATCH` requests are now subject to automatic recursive trimming. String inputs will have leading and trailing whitespace removed automatically by the server.
