#!/bin/sh
# run_tests.sh — corre dentro del contenedor de tests (stage "test" del Dockerfile)
# El directorio /out se monta desde el CI: docker run --rm -v ".../TestResults:/out" backend-test:ci
# Todo lo que se escribe en /out sale al volumen y puede subirse como artifact.
set -e

echo "▶ Corriendo tests con coverage..."
go test -v -coverprofile=/out/coverage.out ./internal/bookings ./internal/courts 2>&1 | tee /out/test-results.txt

echo "▶ Generando reporte de funciones..."
go tool cover -func=/out/coverage.out | tee /out/coverage-func.txt

echo "▶ Filtrando solo la capa de servicio para el umbral..."
grep -E '^(mode:|turnero/internal/bookings/service\.go|turnero/internal/courts/service\.go)' \
    /out/coverage.out > /out/service_coverage.out

echo "▶ Generando reporte HTML..."
go tool cover -html=/out/coverage.out -o /out/coverage.html

COVERAGE=$(go tool cover -func=/out/service_coverage.out | grep total | awk '{gsub(/%/,"",$3); print int($3)}')
echo "──────────────────────────────────────────────"
echo "📦 Cobertura del paquete completo  : $(go tool cover -func=/out/coverage.out | grep total | awk '{print $3}')"
echo "🎯 Cobertura capa de servicio (gate): ${COVERAGE}%  (umbral: 80%)"
echo "──────────────────────────────────────────────"

if [ "$COVERAGE" -lt 80 ]; then
    echo "❌ Cobertura ${COVERAGE}% es menor al umbral del 80%"
    exit 1
fi
echo "✅ Umbral superado"
