# DegreeMapper

DegreeMapper is a Next.js application designed to help students plan their academic journey by mapping out courses and degree requirements.

## Features

- Comprehensive multi-year undergraduate degree planning
- Drag-and-drop interface for organizing courses
- Integration with university course data
- Academic requirement tracking
- AI Assistant (upcoming)

## Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- MongoDB (local or remote)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MichaelangJason/DegreeMapper.git
   cd DegreeMapper
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables (with the following value being default, can be replaced with your adaptation):
   ```
   NEXT_PUBLIC_SCHOOL_DOMAIN=https://www.mcgill.ca
   NEXT_PUBLIC_ACADEMIC_YEAR=2024-2025
   NEXT_PUBLIC_SCHOOL_ENDPOINT=/study/ACADEMIC_YEAR/courses

   MONGODB_URI=mongodb://localhost:27017/
   MONGODB_DATABASE_NAME=planner
   DOMAIN=http://localhost:3000
   ```

   - `NEXT_PUBLIC_SCHOOL_DOMAIN`: The base URL of the school's website
   - `NEXT_PUBLIC_ACADEMIC_YEAR`: The current academic year
   - `NEXT_PUBLIC_SCHOOL_ENDPOINT`: The endpoint for course data (note: ACADEMIC_YEAR will be replaced with the value from NEXT_PUBLIC_ACADEMIC_YEAR)
   - `DATABASE_URL`: MongoDB connection string
   - `DATABASE_NAME`: Name of the database
   - `DOMAIN`: The domain where the application is hosted

## Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Mode

1. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   # or
   bun build
   ```

2. Start the production server:
   ```bash
   npm start
   # or
   yarn start
   # or
   pnpm start
   # or
   bun start
   ```

## Project Structure

- `/src/app`: Main application pages and API routes
- `/src/components`: Reusable React components
- `/src/db`: Database models and connection logic
- `/src/store`: Redux store configuration
- `/src/styles`: Global styles and theme configuration
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions
- `/src/tests`: Test files

## License

This project is licensed under the terms found in the LICENSE file.
