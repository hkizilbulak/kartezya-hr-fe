# Stage 1: Build Next.js static export
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Build arguments for Next.js environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CV_SEARCH_API_URL
ARG NEXT_PUBLIC_ENABLE_EMAIL_PASSWORD_LOGIN
ARG NEXT_PUBLIC_KSPEAKER_BASE_URL
ARG NEXT_PUBLIC_KSPEAKER_API_KEY

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_CV_SEARCH_API_URL=${NEXT_PUBLIC_CV_SEARCH_API_URL}
ENV NEXT_PUBLIC_ENABLE_EMAIL_PASSWORD_LOGIN=${NEXT_PUBLIC_ENABLE_EMAIL_PASSWORD_LOGIN}
ENV NEXT_PUBLIC_KSPEAKER_BASE_URL=${NEXT_PUBLIC_KSPEAKER_BASE_URL}
ENV NEXT_PUBLIC_KSPEAKER_API_KEY=${NEXT_PUBLIC_KSPEAKER_API_KEY}

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build Next.js static export
COPY . .
RUN npm run build

# Stage 2: Build Go single binary embedding frontend assets
FROM golang:1.25-alpine AS go-builder
WORKDIR /app

COPY go.mod main.go ./
COPY --from=frontend-builder /app/out ./out

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server main.go

# Stage 3: Minimal runtime container
FROM alpine:3.20 AS runner
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=go-builder /app/server ./server

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["./server"]
