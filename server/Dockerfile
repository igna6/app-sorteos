FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

# Limitamos la memoria de Node a 64MB (ahora será ultra ligero sin Playwright)
CMD ["node", "--max-old-space-size=64", "index.js"]
