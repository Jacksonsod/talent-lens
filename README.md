# TalentLens Backend API

TalentLens backend for the AI HR Hackathon, built with Express, Mongoose, JWT, and TypeScript.

## Quick start

1. Create local env file from template.

```bash
cp talent-lens-backend/.env.example talent-lens-backend/.env
```

2. Fill in the backend env values:

- `MONGO_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY` (required for AI extraction/screening)
- `FRONTEND_URL` (allowed CORS origin(s), comma-separated if you need more than one)
- `GEMINI_MODEL` (optional override)
- `PORT` (optional; defaults to `5000`)

The backend also supports optional tuning values for MongoDB timeouts and upload limits.
3. Install and run.

```bash
npm install
npm run dev
```

Base URL (default): `http://localhost:5000`

## Postman setup

Create these Postman environment variables to make requests reusable:

- `baseUrl` = `http://localhost:5000`
- `token` = your JWT from `POST /api/auth/login`
- `jobId` = a job `_id`
- `applicantId` = an applicant `_id`
- `screeningResultId` = a screening result `_id`

For all protected routes, add this header:

```http
Authorization: Bearer {{token}}
```

Suggested request body modes in Postman:

- `POST /api/auth/register` → `raw` JSON
- `POST /api/auth/login` → `raw` JSON
- `POST /api/jobs` and `PUT /api/jobs/:id` → `raw` JSON
- `POST /api/applicants/umurava` → `raw` JSON
- `POST /api/applicants/external` → `form-data`
- `POST /api/applicants/bulk-upload` → `form-data`
- Screening routes → no body required unless noted

## Available scripts

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

## Auth header for protected routes

All `jobs`, `applicants`, and `screening` routes are protected. Send JWT as:

```bash
Authorization: Bearer <jwt_token>
```

## API routes

### Auth (`/api/auth`)

- `POST /register` - register recruiter
- `POST /login` - login recruiter

Register body example:

```json
{
  "firstName": "Jackson",
  "lastName": "Doe",
  "email": "jackson.doe@example.com",
  "password": "StrongPass123!"
}
```

Login body example:

```json
{
  "email": "jackson.doe@example.com",
  "password": "StrongPass123!"
}
```

Success response shape:

```json
{
  "token": "<jwt_token>",
  "user": {
    "firstName": "Jackson",
    "lastName": "Doe",
    "email": "jackson.doe@example.com",
    "role": "recruiter"
  }
}
```

Common auth errors:

- `400` missing required fields
- `401` invalid credentials/token
- `409` user already exists

Postman sample:

- `POST {{baseUrl}}/api/auth/register`
- `POST {{baseUrl}}/api/auth/login`

### Jobs (`/api/jobs`)

- `POST /` - create job
- `GET /` - list logged-in recruiter's jobs (newest first)
- `GET /:id` - get one job (owner only)
- `PUT /:id` - update job fields (owner only)
- `PATCH /:id/status` - update only status (owner only)

Create/Update body example:

```json
{
  "roleTitle": "Backend Engineer",
  "description": "Build and maintain API services.",
  "requirements": ["Node.js", "TypeScript"],
  "requiredSkills": ["Express", "MongoDB"],
  "experienceLevel": "Mid-level",
  "shortlistSize": 10,
  "status": "Draft"
}
```

Valid job status values:

- `Draft`
- `Open`
- `Screening`
- `Closed`

Postman sample:

- `POST {{baseUrl}}/api/jobs`
- `GET {{baseUrl}}/api/jobs`
- `GET {{baseUrl}}/api/jobs/{{jobId}}`
- `PUT {{baseUrl}}/api/jobs/{{jobId}}`
- `PATCH {{baseUrl}}/api/jobs/{{jobId}}/status`

### Applicants (`/api/applicants`)

- `POST /umurava` - add Umurava applicant to a job you own
- `POST /external` - add external applicant to a job you own (supports PDF upload)
- `POST /bulk-upload` - bulk upload PDF resumes and auto-extract applicant data with Gemini
- `GET /job/:jobId` - list all applicants for one owned job
- `GET /:id` - get one applicant by ID (owner only via populated job)

Umurava applicant body example:

```json
{
  "jobId": "<job_id>",
  "firstName": "Aline",
  "lastName": "Mukamana",
  "email": "aline@example.com",
  "phone": "+250700000000",
  "skills": ["Node.js", "TypeScript"],
  "yearsOfExperience": 4,
  "educationLevel": "Bachelor",
  "currentRole": "Software Engineer",
  "profileData": {
    "umuravaId": "umr_123"
  }
}
```

Postman sample:

- `POST {{baseUrl}}/api/applicants/umurava`
- `POST {{baseUrl}}/api/applicants/external`
- `POST {{baseUrl}}/api/applicants/bulk-upload`
- `GET {{baseUrl}}/api/applicants/job/{{jobId}}`
- `GET {{baseUrl}}/api/applicants/{{applicantId}}`

External applicant request uses `multipart/form-data`.

- File field: `resume`
- Allowed type: `application/pdf`
- Max size: `5MB`
- `jobId` must be sent as a text field in the same form data
- If a PDF is uploaded, the raw text is extracted and stored in `profileData.rawResumeText`
- If you want to test the URL-based flow, send `resumeUrl` and leave `resume` empty

External applicant form fields example:

```json
{
  "jobId": "<job_id>",
  "firstName": "Eric",
  "lastName": "Niyonzima",
  "email": "eric@example.com",
  "skills": ["MongoDB", "REST APIs"],
  "yearsOfExperience": 3,
  "educationLevel": "Bachelor",
  "resumeUrl": "https://example.com/resumes/eric.pdf"
}
```

Example Postman form-data fields:

- `jobId` → `<job_id>`
- `firstName` → `Eric`
- `lastName` → `Niyonzima`
- `email` → `eric@example.com`
- `skills` → `MongoDB` (add multiple rows for more skills)
- `yearsOfExperience` → `3`
- `educationLevel` → `Bachelor`
- `resume` → choose a PDF file
- `resumeUrl` → optional URL string

Example Postman form-data fields for URL-based parsing only:

- `jobId` → `<job_id>`
- `firstName` → `Eric`
- `lastName` → `Niyonzima`
- `email` → `eric@example.com`
- `skills` → `MongoDB` (add multiple rows for more skills)
- `yearsOfExperience` → `3`
- `educationLevel` → `Bachelor`
- `currentRole` → `Backend Developer`
- `resumeUrl` → `https://example.com/resumes/eric.pdf`
- `resume` → do not add this field

Common applicant errors:

- `403` recruiter does not own the target job/applicant
- `404` job/applicant not found
- `409` duplicate applicant for same job/email (`jobId + email`)

Bulk upload (`POST /api/applicants/bulk-upload`) request uses `multipart/form-data`.

- Text field: `jobId` (required)
- File field: `resumes` (required, repeat this key for multiple PDF files)
- Allowed type per file: `application/pdf`
- Max size per file: `5MB`
- Files are processed sequentially; for batches larger than 5 files, the API waits 4 seconds between files to reduce Gemini free-tier rate-limit failures.

Gemini extraction output per file is normalized to Applicant fields:

- `firstName` (default: `Unknown`)
- `lastName` (default: `Candidate`)
- `email` (fallback generated if missing)
- `skills` (string array)
- `yearsOfExperience` (number)
- `educationLevel`
- `currentRole`

Bulk upload success response shape (`200`):

```json
{
  "message": "Bulk upload and extraction completed.",
  "successfulUploads": 2,
  "failedUploads": 1,
  "results": [{ "_id": "<applicant_id>", "status": "pending" }],
  "errors": [{ "fileName": "bad_resume.pdf", "error": "Failed to process file." }]
}
```

### Screening (`/api/screening`)

- `POST /job/:jobId/applicant/:applicantId/screen` - run AI screening for one applicant on an owned job
- `POST /job/:jobId/screen-all` - screen all pending applicants for an owned job in batches of 5
- `GET /job/:jobId/shortlist` - return top completed results for an owned job
- `GET /:id` - return detailed screening result by screening result ID (owner only)

Screening behavior summary:

- Creates/updates a `ScreeningResult` per `{ jobId, applicantId }`
- Marks status `Pending` before calling Gemini
- Parses Gemini JSON response and stores:
  - `matchScore`
  - `scoreBreakdown`
  - `strengths`
  - `gaps`
  - `reasoning`
  - `finalRecommendation`
- Marks status `Completed` on success or `Failed` on parse/runtime failure

Shortlist behavior summary:

- Uses job `shortlistSize` (defaults to `10`)
- Returns only `Completed` screenings
- Sorts by `matchScore` descending

Screening detail behavior summary:

- Loads screening result with populated `applicantId` and `jobId`
- Verifies the populated job belongs to the authenticated recruiter
- Returns full screening payload (`scoreBreakdown`, `strengths`, `gaps`, `reasoning`, recommendation, status)

Batch screening behavior summary:

- Screens all applicants with `status === 'pending'` for the job
- Processes applicants in batches of 5 using Gemini
- Marks successful applicants as `screened`
- Returns `{ jobId, totalScreened, totalFailed, results }`

Postman sample:

- `POST {{baseUrl}}/api/screening/job/{{jobId}}/applicant/{{applicantId}}/screen`
- `POST {{baseUrl}}/api/screening/job/{{jobId}}/screen-all`
- `GET {{baseUrl}}/api/screening/job/{{jobId}}/shortlist`
- `GET {{baseUrl}}/api/screening/{{screeningResultId}}`

Common screening errors:

- `401` missing/invalid auth token
- `403` recruiter does not own the job
- `404` job/applicant/screening result not found
- `500` Gemini/parsing/internal failure

## Sample data for each API endpoint

Use `{{baseUrl}}` and `Authorization: Bearer {{token}}` for protected routes.

### Auth endpoints

`POST {{baseUrl}}/api/auth/register`

```json
{
  "firstName": "Jackson",
  "lastName": "Doe",
  "email": "jackson.doe@example.com",
  "password": "StrongPass123!"
}
```

Sample success response (`201`):

```json
{
  "token": "<jwt_token>",
  "user": {
    "firstName": "Jackson",
    "lastName": "Doe",
    "email": "jackson.doe@example.com",
    "role": "recruiter"
  }
}
```

`POST {{baseUrl}}/api/auth/login`

```json
{
  "email": "jackson.doe@example.com",
  "password": "StrongPass123!"
}
```

Sample success response (`200`):

```json
{
  "token": "<jwt_token>",
  "user": {
    "firstName": "Jackson",
    "lastName": "Doe",
    "email": "jackson.doe@example.com",
    "role": "recruiter"
  }
}
```

### Job endpoints

`POST {{baseUrl}}/api/jobs`

```json
{
  "roleTitle": "Backend Engineer",
  "description": "Build and maintain API services.",
  "requirements": ["Node.js", "TypeScript"],
  "requiredSkills": ["Express", "MongoDB"],
  "experienceLevel": "Mid-level",
  "shortlistSize": 10,
  "status": "Draft"
}
```

Sample success response (`201`):

```json
{
  "_id": "<job_id>",
  "createdBy": "<user_id>",
  "roleTitle": "Backend Engineer",
  "description": "Build and maintain API services.",
  "requirements": ["Node.js", "TypeScript"],
  "requiredSkills": ["Express", "MongoDB"],
  "experienceLevel": "Mid-level",
  "shortlistSize": 10,
  "status": "Draft",
  "createdAt": "2026-04-07T10:30:00.000Z",
  "updatedAt": "2026-04-07T10:30:00.000Z"
}
```

`GET {{baseUrl}}/api/jobs`

Sample success response (`200`):

```json
[
  {
    "_id": "<job_id>",
    "roleTitle": "Backend Engineer",
    "status": "Draft"
  }
]
```

`GET {{baseUrl}}/api/jobs/{{jobId}}`

Sample success response (`200`):

```json
{
  "_id": "{{jobId}}",
  "roleTitle": "Backend Engineer",
  "description": "Build and maintain API services.",
  "requirements": ["Node.js", "TypeScript"],
  "requiredSkills": ["Express", "MongoDB"],
  "experienceLevel": "Mid-level",
  "shortlistSize": 10,
  "status": "Draft"
}
```

`PUT {{baseUrl}}/api/jobs/{{jobId}}`

```json
{
  "roleTitle": "Senior Backend Engineer",
  "description": "Design and maintain backend services.",
  "requirements": ["Node.js", "TypeScript", "System Design"],
  "requiredSkills": ["Express", "MongoDB", "Redis"],
  "experienceLevel": "Senior",
  "shortlistSize": 20
}
```

Sample success response (`200`):

```json
{
  "_id": "{{jobId}}",
  "roleTitle": "Senior Backend Engineer",
  "shortlistSize": 20,
  "status": "Draft"
}
```

`PATCH {{baseUrl}}/api/jobs/{{jobId}}/status`

```json
{
  "status": "Open"
}
```

Sample success response (`200`):

```json
{
  "_id": "{{jobId}}",
  "status": "Open"
}
```

### Applicant endpoints

`POST {{baseUrl}}/api/applicants/umurava`

```json
{
  "jobId": "{{jobId}}",
  "firstName": "Aline",
  "lastName": "Mukamana",
  "email": "aline@example.com",
  "phone": "+250700000000",
  "skills": ["Node.js", "TypeScript"],
  "yearsOfExperience": 4,
  "educationLevel": "Bachelor",
  "currentRole": "Software Engineer",
  "profileData": {
    "umuravaId": "umr_123"
  }
}
```

Sample success response (`201`):

```json
{
  "_id": "<applicant_id>",
  "jobId": "{{jobId}}",
  "source": "Umurava",
  "firstName": "Aline",
  "lastName": "Mukamana",
  "email": "aline@example.com",
  "status": "pending"
}
```

`POST {{baseUrl}}/api/applicants/external` (form-data)

Text fields:

- `jobId`: `{{jobId}}`
- `firstName`: `Eric`
- `lastName`: `Niyonzima`
- `email`: `eric@example.com`
- `skills`: `MongoDB` (repeat key for multiple values)
- `yearsOfExperience`: `3`
- `educationLevel`: `Bachelor`
- `currentRole`: `Backend Developer` (optional)
- `resumeUrl`: `https://example.com/resumes/eric.pdf` (optional)

File field:

- `resume`: attach PDF (`application/pdf`, max `5MB`)

Sample success response (`201`):

```json
{
  "_id": "<applicant_id>",
  "jobId": "{{jobId}}",
  "source": "External",
  "firstName": "Eric",
  "lastName": "Niyonzima",
  "email": "eric@example.com",
  "profileData": {
    "rawResumeText": "...extracted PDF text..."
  },
  "status": "pending"
}
```

`POST {{baseUrl}}/api/applicants/bulk-upload` (form-data)

Text fields:

- `jobId`: `{{jobId}}`

File fields:

- `resumes`: attach one or more PDF files (repeat the same key)

Sample success response (`200`):

```json
{
  "message": "Bulk upload and extraction completed.",
  "successfulUploads": 2,
  "failedUploads": 1,
  "results": [
    {
      "_id": "<applicant_id_1>",
      "jobId": "{{jobId}}",
      "source": "External",
      "firstName": "Aline",
      "lastName": "Mukamana",
      "email": "aline@example.com",
      "status": "pending"
    },
    {
      "_id": "<applicant_id_2>",
      "jobId": "{{jobId}}",
      "source": "External",
      "firstName": "Eric",
      "lastName": "Niyonzima",
      "email": "eric@example.com",
      "status": "pending"
    }
  ],
  "errors": [
    {
      "fileName": "corrupted.pdf",
      "error": "Failed to process file."
    }
  ]
}
```

`GET {{baseUrl}}/api/applicants/job/{{jobId}}`

Sample success response (`200`):

```json
[
  {
    "_id": "<applicant_id>",
    "jobId": "{{jobId}}",
    "firstName": "Aline",
    "lastName": "Mukamana",
    "status": "pending"
  }
]
```

`GET {{baseUrl}}/api/applicants/{{applicantId}}`

Sample success response (`200`):

```json
{
  "_id": "{{applicantId}}",
  "jobId": {
    "_id": "{{jobId}}",
    "roleTitle": "Backend Engineer"
  },
  "firstName": "Aline",
  "lastName": "Mukamana",
  "email": "aline@example.com",
  "status": "pending"
}
```

### Screening endpoints

`POST {{baseUrl}}/api/screening/job/{{jobId}}/applicant/{{applicantId}}/screen`

Sample success response (`200`):

```json
{
  "_id": "<screening_result_id>",
  "jobId": "{{jobId}}",
  "applicantId": "{{applicantId}}",
  "status": "Completed",
  "matchScore": 84,
  "scoreBreakdown": {
    "skills": 88,
    "experience": 80,
    "education": 78,
    "relevance": 90
  },
  "strengths": ["Strong TypeScript fundamentals"],
  "gaps": ["Limited distributed systems exposure"],
  "reasoning": "The applicant has strong matching backend skills and relevant experience.",
  "finalRecommendation": "Hire"
}
```

`POST {{baseUrl}}/api/screening/job/{{jobId}}/screen-all`

Sample success response (`200`):

```json
{
  "jobId": "{{jobId}}",
  "totalScreened": 2,
  "totalFailed": 0,
  "results": [
    {
      "_id": "<screening_result_id_1>",
      "status": "Completed",
      "matchScore": 91
    },
    {
      "_id": "<screening_result_id_2>",
      "status": "Completed",
      "matchScore": 79
    }
  ]
}
```

`GET {{baseUrl}}/api/screening/job/{{jobId}}/shortlist`

Sample success response (`200`):

```json
{
  "jobId": "{{jobId}}",
  "shortlistSize": 10,
  "count": 2,
  "results": [
    {
      "_id": "<screening_result_id_1>",
      "matchScore": 91,
      "status": "Completed",
      "applicantId": {
        "_id": "<applicant_id>",
        "firstName": "Aline",
        "lastName": "Mukamana"
      }
    }
  ]
}
```

`GET {{baseUrl}}/api/screening/{{screeningResultId}}`

Sample success response (`200`):

```json
{
  "_id": "{{screeningResultId}}",
  "jobId": {
    "_id": "{{jobId}}",
    "roleTitle": "Backend Engineer",
    "description": "Build and maintain API services."
  },
  "applicantId": {
    "_id": "{{applicantId}}",
    "firstName": "Aline",
    "lastName": "Mukamana",
    "email": "aline@example.com"
  },
  "status": "Completed",
  "matchScore": 84,
  "scoreBreakdown": {
    "skills": 88,
    "experience": 80,
    "education": 78,
    "relevance": 90
  },
  "strengths": ["Strong TypeScript fundamentals"],
  "gaps": ["Limited distributed systems exposure"],
  "reasoning": "The applicant has strong matching backend skills and relevant experience.",
  "finalRecommendation": "Hire"
}
```

## Quick test flow (curl)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Jackson","lastName":"Doe","email":"jackson.doe@example.com","password":"StrongPass123!"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jackson.doe@example.com","password":"StrongPass123!"}'
```

Use the returned token for protected routes:

```bash
curl -X GET http://localhost:5000/api/jobs \
  -H 'Authorization: Bearer <jwt_token>'
```

External applicant upload example:

```bash
curl -X POST http://localhost:5000/api/applicants/external \
  -H 'Authorization: Bearer <jwt_token>' \
  -F "jobId=<job_id>" \
  -F "firstName=Eric" \
  -F "lastName=Niyonzima" \
  -F "email=eric@example.com" \
  -F "skills[]=MongoDB" \
  -F "skills[]=REST APIs" \
  -F "yearsOfExperience=3" \
  -F "educationLevel=Bachelor" \
  -F "resume=@/absolute/path/to/resume.pdf;type=application/pdf"
```

Bulk upload and AI extract example:

```bash
curl -X POST http://localhost:5000/api/applicants/bulk-upload \
  -H 'Authorization: Bearer <jwt_token>' \
  -F "jobId=<job_id>" \
  -F "resumes=@/absolute/path/to/resume1.pdf;type=application/pdf" \
  -F "resumes=@/absolute/path/to/resume2.pdf;type=application/pdf" \
  -F "resumes=@/absolute/path/to/resume3.pdf;type=application/pdf"
```

Run AI screening for one applicant:

```bash
curl -X POST http://localhost:5000/api/screening/job/<job_id>/applicant/<applicant_id>/screen \
  -H 'Authorization: Bearer <jwt_token>'
```

Run batch screening for all pending applicants in a job:

```bash
curl -X POST http://localhost:5000/api/screening/job/<job_id>/screen-all \
  -H 'Authorization: Bearer <jwt_token>'
```

Get shortlist for a job:

```bash
curl -X GET http://localhost:5000/api/screening/job/<job_id>/shortlist \
  -H 'Authorization: Bearer <jwt_token>'
```

Get detailed screening result by ID:

```bash
curl -X GET http://localhost:5000/api/screening/<screening_result_id> \
  -H 'Authorization: Bearer <jwt_token>'
```

## MongoDB troubleshooting

If startup fails with Atlas connection errors:

- ensure your current IP is in Atlas Network Access (IP allowlist)
- verify `MONGO_URI` in `.env`
- verify DB user credentials and read/write permissions

If MongoDB is unreachable, server startup exits until connectivity is fixed.
Backennd workflows added

