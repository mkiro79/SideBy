# SideBy API

Backend API for the SideBy application built with Node.js, Express, TypeScript, and MongoDB.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas connection string

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the `.env.example` file to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

### Development

Run the development server with hot reload:
```bash
npm run dev
```

### Build

Build the TypeScript project:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

### Lint

Run ESLint:
```bash
npm run lint
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API welcome message

## Project Structure

```
src/
├── config/          # Configuration files (database, etc.)
├── middleware/      # Express middleware
└── index.ts         # Application entry point
```
