# Wealth Portfolio Tracker

A web application for managing investment portfolios across stocks, cryptocurrency, cash, and real estate. Users can organize portfolios, manage member access, record financial activity, and view portfolio summaries. An AI assistant helps answer questions about portfolio data.

## Features

- **Authentication:** User registration, login, and logout.
- **Portfolio management:** Create and view portfolios.
- **Access control:** Manage portfolio membership with Owner, Editor, and Viewer roles.
- **Asset tracking:** Record stocks, cryptocurrency, cash, and real estate.
- **Financial activity:** Record transactions and asset valuations.
- **Portfolio summaries:** View holdings and estimated values grouped by currency.
- **AI assistant:** Ask questions about portfolio data through a read-only Gemini-powered assistant.

## Tech Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Better Auth
- Google Gemini API

## Getting Started

### Prerequisites

- Node.js and npm
- Docker with Docker Compose
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/Ibtesam-k/wealth-portfolio-tracker.git
cd wealth-portfolio-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```dotenv
DATABASE_URL="postgresql://wealth_user:local_dev_password@localhost:5433/wealth_tracker?schema=public"
BETTER_AUTH_SECRET="your-generated-secret"
BETTER_AUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
```

Generate an authentication secret with:

```bash
openssl rand -base64 32
```

Replace the placeholder values with your

&#x20;local configuration and Gemini API key. Keep `.env` out of version control.

### 4. Start the database

```bash
docker compose up -d db
```

This starts PostgreSQL 17 on port `5433`.

### 5. Apply database migrations

```bash
npx prisma migrate deploy
```

### 6. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development Commands

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## License

No license has been specified.
