# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# copiar dependencias primero (mejor cache)
COPY package*.json ./

RUN npm install

# copiar código
COPY . .

# compilar el proyecto
RUN npm run build


# ---------- Stage 2: runtime ----------
FROM node:20-alpine

WORKDIR /app

# copiar solo dependencias necesarias
COPY package*.json ./

RUN npm install --omit=dev

# copiar solo el build compilado
COPY --from=builder /app/.build ./.build


# ejecutar aplicación
CMD ["node", ".build/src/main"]