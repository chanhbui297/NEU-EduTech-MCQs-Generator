# ===== Build stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# Chỉ copy package.json của frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy toàn bộ source frontend
COPY frontend/ .
RUN npm run build


# ===== Production stage =====
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

# Copy build output từ Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
