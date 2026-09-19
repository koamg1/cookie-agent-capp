#!/bin/bash
# Script de Despliegue en Oracle Cloud Santiago (146.181.24.180)
set -e

echo "=== Desplegando CookieAgent cApp en Oracle Santiago ==="
cd "$(dirname "$0")"

# Construir y levantar contenedor
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo "=== Verificando Estado del Servicio ==="
sleep 3
curl -s http://127.0.0.1:8080/health | jq .

echo "=== Despliegue Completado con Éxito ==="
echo "Acceso público: http://146.181.24.180:8080"
echo "Documentación Swagger: http://146.181.24.180:8080/docs"
