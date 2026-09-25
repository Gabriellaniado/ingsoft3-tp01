# ---- Etapa 1: build (imagen con el compilador de Go) ----
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /turnero ./cmd/server

# ---- Etapa 2: test (imagen ejecutable — corre en docker run, no en docker build) ----
# Igual al patrón de la cátedra con ENTRYPOINT. Montá /out para sacar los artifacts:
#   docker run --rm -v ".../TestResults:/out" backend-test:ci
FROM builder AS test
COPY scripts/run_tests.sh /run_tests.sh
RUN chmod +x /run_tests.sh
ENTRYPOINT ["/run_tests.sh"]

# ---- Etapa 3: runtime (imagen mínima, sin compilador) ----
FROM alpine:3.21
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /turnero .
EXPOSE 8080
CMD ["./turnero"]
