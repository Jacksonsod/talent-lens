# TalentLens Backend

## Environment setup

1. Copy the template file:

```bash
cp .env.example .env
```

2. Update `.env` values as needed (especially `MONGO_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`).

## Run locally

```bash
npm install
npm run dev
```

## Build and start

```bash
npm run build
npm start
```

## Postman API endpoints (Auth)

Base URL:

```bash
http://localhost:5000
```

### 1) Register recruiter

- Method: `POST`
- URL: `http://localhost:5000/api/auth/register`
- Success status: `201`

Request body (JSON):

```json
{
  "firstName": "Jackson",
  "lastName": "Doe",
  "email": "jackson.doe@example.com",
  "password": "StrongPass123!"
}
```

Success response example:

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

### 2) Login recruiter

- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Success status: `200`

Request body (JSON):

```json
{
  "email": "jackson.doe@example.com",
  "password": "StrongPass123!"
}
```

Success response example:

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

### Common auth errors

- `400`: Missing required fields
- `401`: Invalid credentials
- `409`: User already exists

### Authorization header for protected routes

After login/register, copy the returned token and send this header in Postman:

```bash
Authorization: Bearer <jwt_token>
```

