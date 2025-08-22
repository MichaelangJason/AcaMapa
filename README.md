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
   Create a `.env` file in the root directory with the following variables:

   ```
   # School-related configuration
   NEXT_PUBLIC_SCHOOL_DOMAIN=https://www.mcgill.ca
   NEXT_PUBLIC_ACADEMIC_YEAR=2024-2025
   NEXT_PUBLIC_SCHOOL_ENDPOINT=/study/ACADEMIC_YEAR/courses/

   # Database configuration
   MONGODB_URI=mongodb://db:27017/?directConnection=true
   MONGODB_DATABASE_NAME=planner
   DOMAIN=http://localhost:3000

   # AI backend configuration
   AI_BACKEND_URL=http://ai:3030/api/chat
   EMBEDDING_DEVICE=cpu
   EMBEDDING_MODEL=BAAI/bge-m3
   OPENAI_API_KEY=your_openai_api_key

   # Application configuration
   APP_HOST=0.0.0.0
   APP_PORT=3030
   ```

   - `NEXT_PUBLIC_SCHOOL_DOMAIN`: The base URL of the school's website
   - `NEXT_PUBLIC_ACADEMIC_YEAR`: The current academic year
   - `NEXT_PUBLIC_SCHOOL_ENDPOINT`: The endpoint for course data (note: ACADEMIC_YEAR will be replaced with the value from NEXT_PUBLIC_ACADEMIC_YEAR)
   - `MONGODB_URI`: MongoDB connection string
   - `MONGODB_DATABASE_NAME`: Name of the database
   - `DOMAIN`: The domain where the application is hosted
   - `AI_BACKEND_URL`: URL for the AI chat backend service
   - `EMBEDDING_DEVICE`: Device to use for embeddings (cpu/gpu)
   - `EMBEDDING_MODEL`: The model to use for embeddings
   - `OPENAI_API_KEY`: Your OpenAI API key for AI features
   - `APP_HOST`: Host address for the application
   - `APP_PORT`: Port number for the application

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

### Running with Docker

1. Clone the repository:

   ```bash
   git clone https://github.com/MichaelangJason/DegreeMapper.git
   cd DegreeMapper
   ```

2. Initialize and update the AI submodule:

   ```bash
   git submodule update --init --recursive
   ```

3. Create and configure the `.env` file as specified in the Environment Variables section above.

4. Ensure Docker and Docker Compose are installed on your system:

   - [Install Docker](https://docs.docker.com/get-docker/)
   - [Install Docker Compose](https://docs.docker.com/compose/install/)

5. Start the project using the provided script:

   ```bash
   ./start.sh
   ```

   Note: Initial startup may take several minutes as it downloads required dependencies including PyTorch and sentence transformers.

6. To stop and clean up the Docker environment:
   ```bash
   ./cleanup.sh
   ```
   This will stop all containers and remove associated containers, images, and builders.

## Project Structure

- `/src/app`: Main application pages and API routes
- `/src/ai`: AI submodule for the project, including python and will support js in the future
- `/src/components`: Reusable React components
- `/src/db`: Database models and connection logic
- `/src/store`: Redux store configuration
- `/src/styles`: Global styles and theme configuration
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions
- `/src/tests`: Test files

## License

This project is licensed under the terms found in the LICENSE file.
