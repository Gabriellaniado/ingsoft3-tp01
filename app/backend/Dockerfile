# ---- Etapa 1: build (imagen con el compilador de Go) ----
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /turnero ./cmd/server

# ---- Etapa 2: test (corre la suite y verifica el umbral de cobertura) ----
FROM builder AS test
# Corre los tests con cobertura sobre el paquete de lógica de negocio
RUN go test -coverprofile=coverage.out ./internal/bookings && \
    go tool cover -func=coverage.out && \
    grep -E '^(mode:|turnero/internal/bookings/service\.go)' coverage.out > service_coverage.out && \
    go tool cover -func=service_coverage.out && \
    COVERAGE=$(go tool cover -func=service_coverage.out | grep total | awk '{gsub(/%/,"",$3); print int($3)}') && \
    echo "Cobertura de service.go: ${COVERAGE}%" && \
    [ "$COVERAGE" -ge 50 ] || (echo "❌ Cobertura de lógica de negocio ${COVERAGE}% menor al umbral del 50%" && exit 1)

# ---- Etapa 3: runtime (imagen mínima, sin compilador) ----
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /turnero .
EXPOSE 8080
CMD ["./turnero"]
