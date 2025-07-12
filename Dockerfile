# ----------------------------------------
# Etapa 1: Construcción (Build)
# Esta etapa compila la aplicación de React usando Node.js
# ----------------------------------------

# Usa la imagen oficial de Node.js (versión 20 o 22, alpine es más ligera)
# 'AS build' nombra esta etapa para referenciarla más tarde
FROM node:20-alpine AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración de dependencias (package.json y package-lock.json)
# Esto permite que Docker use el cache de capas si las dependencias no cambian
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Copia el código fuente completo del proyecto al contenedor
COPY . .

# DECLARA VITE_API_URL COMO UN ARGUMENTO DE CONSTRUCCIÓN
# Render pasará las variables de entorno configuradas en el dashboard como ARGs al Docker build.
ARG VITE_API_URL

# Construye la aplicación de React.
# PASA EXPLÍCITAMENTE VITE_API_URL AL COMANDO DE CONSTRUCCIÓN DE VITE.
# Esto asegura que Vite reemplace 'import.meta.env.VITE_API_URL' con el valor correcto.
RUN VITE_API_URL=${VITE_API_URL} npm run build

# ----------------------------------------
# Etapa 2: Servir (Serve)
# Esta etapa usa un servidor web ligero (Nginx) para servir los archivos estáticos generados
# ----------------------------------------

# Usa la imagen oficial de Nginx (versión alpine es más ligera)
# 'AS serve' nombra esta etapa
FROM nginx:alpine AS serve

# Elimina la configuración por defecto de Nginx para evitar conflictos
RUN rm /etc/nginx/conf.d/default.conf

# Copia los archivos estáticos compilados desde la etapa 'build' al directorio de Nginx
# Asegúrate de que '/app/dist' sea la ruta correcta donde Vite genera tu build.
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configuración personalizada de Nginx.
# Este archivo es CRUCIAL para aplicaciones de React (SPAs) para manejar el enrutamiento.
# Deberás crear un directorio 'nginx' en la raíz de tu proyecto y dentro, un archivo 'nginx.conf'.
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

# Comando para iniciar Nginx en primer plano y servir la aplicación
CMD ["nginx", "-g", "daemon off;"]
