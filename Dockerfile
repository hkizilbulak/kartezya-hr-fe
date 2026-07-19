# Stage 1: Build Go single binary embedding pre-built static export
FROM golang:1.25-alpine AS go-builder
WORKDIR /app

COPY go.mod main.go ./
COPY out ./out

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server main.go

# Stage 2: Minimal runtime container
FROM alpine:3.20 AS runner
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=go-builder /app/server ./server

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["./server"]
