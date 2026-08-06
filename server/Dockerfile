FROM node:20-alpine

# Instalar Chromium nativo de Alpine (mucho más ligero que la imagen de Ubuntu de Microsoft)
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

WORKDIR /app

COPY package*.json ./

# Solo instalar dependencias de producción, omitiendo paquetes de playwright extra
RUN npm install --omit=dev

COPY . .

# Le decimos a Playwright que use el navegador de Alpine
ENV CHROMIUM_PATH="/usr/bin/chromium-browser"

EXPOSE 3001

# Limitamos la memoria de Node a 64MB para dejarle más de 400MB libres al navegador
CMD ["node", "--max-old-space-size=64", "index.js"]
