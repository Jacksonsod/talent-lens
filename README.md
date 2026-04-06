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

## Troubleshooting

If you see a MongoDB Atlas connection error like:

```text
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster
```

check these items:

- Your current IP address is added to the Atlas IP Access List
- `MONGO_URI` is correct in `.env`
- The Atlas database user has read/write access

When MongoDB is unreachable, the server will not start until the Atlas connection is fixed.

