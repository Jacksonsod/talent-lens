# TalentLens - Umurava AI Hackathon Submission (Team Arc Lab)

An AI-powered talent profile screening engine designed to augment recruiter decision-making with transparent reasoning, native OCR, and resilient architecture.

## Alignment with Hackathon Goals (The Problem & Solution)

TalentLens addresses the practical bottleneck of high-volume hiring: recruiters must evaluate large numbers of unstructured resumes quickly, fairly, and with traceable logic.

- **Handling Unstructured Data**: We use Gemini 1.5 Flash native vision with inline PDF processing so the system can read complex, scanned resumes without depending on heavy third-party OCR stacks.
- **Standardization**: Parsed outputs are mapped into the Umurava Talent Profile Schema, converting noisy documents into consistent structured profiles for objective comparison.
- **AI Clarity & Human-in-the-Loop**: TalentLens does not auto-reject candidates. It generates `matchScore`, detailed `scoreBreakdown`, and an `incompleteSummary` that explains exactly why a profile was flagged (for example `404 Not Found` or `Unreadable Scan`). Final hiring decisions remain with the recruiter.

## Engineering Quality & Product Thinking

Our backend is built for production-like resilience under real recruitment load.

- **Zero-Data-Entry Pipeline**: Recruiters can upload files or provide resume URLs; the API handles Axios buffer fetching, Gemini extraction, schema mapping, and persistence in one flow.
- **Failure-Tolerant Processing**: Strict `try/catch` boundaries prevent pipeline collapse. If URL fetching fails or core identity/history fields are missing, processing continues safely.
- **Resilience Tracking**: The system marks such profiles with `isResumeIncomplete`, stores exact diagnostics in `resumeFetchError`, and keeps batch operations running so one bad resume never blocks shortlist generation.

## Technical Stack

- Node.js
- Express
- TypeScript
- Mongoose + MongoDB
- Google Generative AI (Gemini Flash)

## Quick start

### 1. Backend Setup

```bash
# Navigate to backend
cd talent-lens-backend

# Create env file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Backend Environment Variables (.env):**
- `MONGO_URI`: Your MongoDB connection string.
- `JWT_SECRET`: Secret key for authentication.
- `GEMINI_API_KEY`: Required for AI extraction/screening.
- `FRONTEND_URL`: Allowed CORS origin (e.g., `http://localhost:3000`).
- `PORT`: Server port (defaults to `5000`).

### 2. Frontend Setup

```bash
# Navigate to frontend
cd talent-lens-frontend

# Create env file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend Environment Variables (.env):**
- `NEXT_PUBLIC_API_URL`: The URL of your running backend (e.g., `http://localhost:5000`).

---

**Default Access:**
- Backend API: `http://localhost:5000`
- Frontend UI: `http://localhost:3000`

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

- `POST /api/auth/login` → `raw` JSON
- `POST /api/jobs` and `PUT /api/jobs/:id` → `raw` JSON
- `POST /api/applicants/umurava` → `raw` JSON
- `POST /api/applicants/external` → `form-data` (file key must be exactly `resume`)
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

- `POST /login` - login recruiter

Login body example:

```json
{
  "email": "edison@gmail.com",
  "password": "Admin@123"
}
```

#### Sample Test Accounts
| Email | Password | Role |
|---|---|---|
| `edison@gmail.com` | `Admin@123` | Recruiter |
| `jacksonbimenyimana3@gmail.com` | `Admin@123` | Recruiter |

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

Postman sample:

- `POST {{baseUrl}}/api/auth/login`

### Jobs (`/api/jobs`)

- `POST /` - create job
- `GET /` - list logged-in recruiter's jobs (newest first)
- `GET /:id` - get one job (owner only)
- `PUT /:id` - update job fields (owner only)
- `PATCH /:id/status` - update only status (owner only)
- `DELETE /:id` - delete one job (owner only)

Create/Update body example:

```json
{
  "roleTitle": "Backend Engineer",
  "description": "Build and maintain API services.",
  "requirements": ["Node.js", "TypeScript"],
  "requiredSkills": ["Express", "MongoDB"],
  "experienceLevel": "Mid-level",
  "shortlistSize": 15,
  "status": "Draft"
}
```

`shortlistSize` accepts any positive integer.

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
- `DELETE {{baseUrl}}/api/jobs/{{jobId}}`

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

- In Postman, set **Body** to `form-data`

- File field: `resume` (exact key name required)
- Allowed type: `application/pdf`
- Max size: `5MB`
- `jobId` must be sent as a text field in the same form data
- If a PDF is uploaded, Gemini extracts structured profile data and a snapshot is stored in `profileData.rawResumeText`
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
- `currentRole` → `Backend Developer`
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

- In Postman, set **Body** to `form-data`

- Text field: `jobId` (required)
- File field: `resumes` (required, repeat this key for multiple PDF files)
- Allowed type per file: `application/pdf`
- Max size per file: `5MB`
- Files are processed sequentially; for batches larger than 5 files, the API waits 4 seconds between files to reduce Gemini free-tier rate-limit failures.

Example Postman bulk-upload form-data fields:

- `jobId` → `<job_id>`
- `resumes` → choose `resume1.pdf`
- `resumes` → choose `resume2.pdf`
- `resumes` → choose `resume3.pdf`

Gemini extraction output per file is normalized to the nested Applicant fields:

- `firstName`, `lastName`, `email`, `phone`
- `headline`, `bio`, `location`
- `skills` as objects with `name`, `level`, `yearsOfExperience`
- `languages` as objects with `name`, `proficiency`
- `experience` as objects with `company`, `role`, `startDate`, `endDate`, `description`, `technologies`, `isCurrent`
- `education` as objects with `institution`, `degree`, `fieldOfStudy`, `startYear`, `endYear`
- `certifications`
- `projects`
- `socialLinks`

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
- Also returns `incompleteSummary` and `incompleteApplicants` so recruiters can see exactly which candidates were skipped and why (for example, URL access denied or missing core resume data)

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

## AI Decision Flow

TalentLens uses a multi-stage AI pipeline to ensure accuracy and transparency:

1.  **Native Extraction**: Gemini 1.5 Flash reads raw PDF bytes. It extracts skills, experience, and education, mapping them to the structured Umurava schema.
2.  **Validation**: The system checks for "Core History" (identity and experience). If a resume is unreadable or missing these fields, it is flagged as `isResumeIncomplete` rather than silently ignored.
3.  **Contextual Screening**: The AI evaluates the candidate against specific `requirements` and `requiredSkills` of the job. It considers years of experience, education level, and skill relevance.
4.  **Scoring & Reasoning**: Each screening produces a `matchScore` (0-100) and a `scoreBreakdown`. Crucially, the AI provides a `reasoning` string explaining its logic.
5.  **Heuristic Resilience**: If the Gemini API is unreachable (e.g., quota exceeded), the system falls back to a deterministic heuristic scorer to estimate alignment, ensuring recruiters always have a baseline.

## Assumptions & Limitations

-   **AI Accuracy**: While Gemini 1.5 Flash is highly capable, some edge-case formatting in resumes may lead to parsing errors.
-   **Rate Limiting**: The free tier of Gemini has strict rate limits. The system uses a batching strategy (5 applicants per batch) and artificial delays to maintain stability.
-   **File Types**: Native PDF text extraction is preferred. Scanned images are processed via vision, but results may vary based on image quality.
-   **Language**: The current prompting and evaluation logic is optimized for English-language resumes.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jackson.doe@example.com","password":"StrongPass123!"}'
```

Use the returned token for protected routes:

```bash
curl -X GET http://localhost:5000/api/jobs \
  -H 'Authorization: Bearer <jwt_token>'
```

Delete a job:

```bash
curl -X DELETE http://localhost:5000/api/jobs/<job_id> \
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

