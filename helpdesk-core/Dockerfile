# 1. Imagen base oficial de Node.js (versión ligera basada en Alpine Linux)
FROM node:20-alpine

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar primero package.json y package-lock.json para aprovechar la caché de Docker
COPY package*.json ./

# 4. Instalar las dependencias dentro del contenedor
RUN npm install

# 5. Copiar todo el código fuente del backend al contenedor
COPY . .

# 6. Exponer el puerto donde escucha Express
EXPOSE 3000

# 7. Comando de arranque del servidor
CMD ["node", "src/app.js"]