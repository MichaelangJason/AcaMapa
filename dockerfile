FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

ARG MONGODB_URI
ARG MONGODB_DATABASE_NAME
ARG AI_BACKEND_URL
ARG NEXT_PUBLIC_SCHOOL_DOMAIN
ARG NEXT_PUBLIC_ACADEMIC_YEAR
ARG NEXT_PUBLIC_SCHOOL_ENDPOINT

ENV MONGODB_URI=$MONGODB_URI
ENV MONGODB_DATABASE_NAME=$MONGODB_DATABASE_NAME
ENV AI_BACKEND_URL=$AI_BACKEND_URL
ENV NEXT_PUBLIC_SCHOOL_DOMAIN=$NEXT_PUBLIC_SCHOOL_DOMAIN
ENV NEXT_PUBLIC_ACADEMIC_YEAR=$NEXT_PUBLIC_ACADEMIC_YEAR
ENV NEXT_PUBLIC_SCHOOL_ENDPOINT=$NEXT_PUBLIC_SCHOOL_ENDPOINT

COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/.next /app/.next
EXPOSE 3000
CMD pnpm start