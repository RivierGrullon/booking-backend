# BookingApp - Backend API

REST API for the booking system with Google Calendar integration.

## 🚀 Features

- **JWT Authentication** - Auth0 integration with RS256 token validation
- **Booking Management** - CRUD operations for time slot bookings
- **Conflict Detection** - Prevents double bookings in the system
- **Google Calendar Integration** - OAuth2 flow to check calendar conflicts
- **API Documentation** - Swagger/OpenAPI documentation

## 🛠️ Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL 16
- **ORM:** Prisma 7
- **Authentication:** Passport JWT + Auth0
- **Google API:** googleapis
- **Documentation:** Swagger

## 📋 Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ (or Docker)
- Auth0 account
- Google Cloud Console project with Calendar API enabled

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://booking_user:booking_pass@localhost:5432/booking_db?schema=public

# Auth0
AUTH0_ISSUER_URL=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=your-api-audience

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback

# App
PORT=4000
FRONTEND_URL=http://localhost:3000
```

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/booking-backend.git
cd booking-backend

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Run in development mode
pnpm start:dev
```

The API will be available at `http://localhost:4000`

Swagger documentation at `http://localhost:4000/api/docs`

## 🐳 Docker

### Run with Docker Compose (recommended)

```bash
# Create environment variables file
cp .env.example .env

# Build and run (includes PostgreSQL)
docker compose up --build

# Run in background
docker compose up -d --build
```

### Manual Docker build

```bash
docker build -t booking-api .
docker run -p 4000:4000 --env-file .env booking-api
```

## 📁 Project Structure

```
src/
├── auth/                       # Authentication module
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── bookings/                   # Bookings module
│   ├── dtos/
│   │   ├── create-booking.ts
│   │   └── booking-response.ts
│   ├── bookings.controller.ts
│   ├── bookings.module.ts
│   └── bookings.service.ts
├── google-calendar/            # Google Calendar integration
│   ├── google-calendar.module.ts
│   └── google-calendar.service.ts
├── prisma/                     # Database service
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

## 📚 API Documentation

Interactive Swagger documentation available at:

```
http://localhost:4000/api/docs
```

## 🔗 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Get current user profile |
| GET | `/auth/google/connect` | Get Google OAuth URL |
| GET | `/auth/google/callback` | Google OAuth callback |
| POST | `/auth/google/disconnect` | Disconnect Google Calendar |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | List all user bookings |
| GET | `/bookings/:id` | Get booking by ID |
| POST | `/bookings` | Create new booking |
| DELETE | `/bookings/:id` | Delete booking |
| GET | `/bookings/slots?date=YYYY-MM-DD` | Get slots for a date |

## 📝 API Request/Response Examples

### Create Booking

**Request:**
```bash
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Team Meeting",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}
```

**Success Response (201):**
```json
{
  "id": "clx123abc...",
  "name": "Team Meeting",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "userId": "clx456def...",
  "createdAt": "2024-01-14T15:30:00.000Z"
}
```

**Conflict Response (409):**
```json
{
  "message": "Time slot conflicts with an existing booking in the system",
  "type": "SYSTEM_CONFLICT",
  "conflictingBooking": {
    "id": "clx789ghi...",
    "name": "Other Meeting",
    "startTime": "2024-01-15T09:30:00.000Z",
    "endTime": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🗄️ Database Schema

```prisma
model User {
  id                        String    @id @default(cuid())
  auth0Id                   String    @unique
  email                     String    @unique
  name                      String?
  picture                   String?
  googleAccessToken         String?
  googleRefreshToken        String?
  googleTokenExpiresAt      DateTime?
  isGoogleCalendarConnected Boolean   @default(false)
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
  bookings                  Booking[]
}

model Booking {
  id        String   @id @default(cuid())
  name      String
  startTime DateTime
  endTime   DateTime
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔐 Auth0 Configuration

1. Create an API in Auth0 Dashboard
2. Set the **Identifier** (this is your `AUTH0_AUDIENCE`)
3. Enable **RS256** signing algorithm
4. The `AUTH0_ISSUER_URL` should be `https://your-tenant.auth0.com/`

## 🔑 Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URI: `http://localhost:4000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## 🧪 Available Scripts

```bash
pnpm start:dev      # Development with hot reload
pnpm start:prod     # Production mode
pnpm build          # Build for production
pnpm prisma:generate # Generate Prisma client
pnpm prisma:migrate  # Run database migrations
pnpm prisma:studio   # Open Prisma Studio
pnpm test           # Run unit tests
pnpm test:e2e       # Run e2e tests
pnpm docker:up      # Start Docker containers
pnpm docker:down    # Stop Docker containers
```
