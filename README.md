# TalentLens Backend API

TalentLens backend for the AI HR Hackathon, built with Express, Mongoose, JWT, and TypeScript.

## Quick start

1. Create local env file from template.

```bash
cp .env.example .env
```

2. Fill in `MONGO_URI`, `JWT_SECRET`, and (optionally for current API scope) `GEMINI_API_KEY`.
3. Install and run.

```bash
npm install
npm run dev
```

Base URL (default): `http://localhost:5000`

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

### Applicants (`/api/applicants`)

- `POST /umurava` - add Umurava applicant to a job you own
- `POST /external` - add external applicant to a job you own (supports PDF upload)
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

External applicant request uses `multipart/form-data`.

- File field: `resume`
- Allowed type: `application/pdf`
- Max size: `5MB`
- `jobId` must be sent as a text field in the same form data

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

When a PDF is uploaded, extracted resume text is stored in:

- `profileData.rawResumeText`

Common applicant errors:

- `403` recruiter does not own the target job/applicant
- `404` job/applicant not found
- `409` duplicate applicant for same job/email (`jobId + email`)

### Screening (`/api/screening`)

- `POST /job/:jobId/applicant/:applicantId/screen` - run AI screening for one applicant on an owned job
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

Common screening errors:

- `401` missing/invalid auth token
- `403` recruiter does not own the job
- `404` job/applicant/screening result not found
- `500` Gemini/parsing/internal failure

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

Run AI screening for one applicant:

```bash
curl -X POST http://localhost:5000/api/screening/job/<job_id>/applicant/<applicant_id>/screen \
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

