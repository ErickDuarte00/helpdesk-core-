FROM node:22-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto donde escucha Astro (4321)
EXPOSE 4321

# Arrancar el servidor de desarrollo exponiéndolo a la red del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
