# ---- Etapa 1: build (compilamos la SPA con Node + Vite) ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM builder AS test
ENTRYPOINT ["npm", "run","test:ci"]

# ---- Etapa 2: runtime (nginx sirve los estáticos) ----
FROM nginx:alpine
# El template se procesa al arrancar: nginx reemplaza ${BACKEND_URL} y ${DNS_RESOLVER}
# con las variables de entorno del contenedor antes de escribir el conf definitivo.
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
# Valores por defecto para docker-compose (el servicio "backend" en la red interna
# y el DNS resolver de Docker). Render los pisa con sus propias variables de entorno.
ENV BACKEND_URL=http://backend:8080 \
    DNS_RESOLVER=127.0.0.11
EXPOSE 80
