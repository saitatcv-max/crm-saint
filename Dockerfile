# Stage 1: Compilación de la aplicación
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar archivos del código fuente y compilar
COPY . .
RUN npm run build

# Stage 2: Servidor Nginx para producción
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
