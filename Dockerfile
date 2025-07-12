# ----------------------------------------
# Etapa 1: Construcción (Build)
# Esta etapa compila la aplicación de React
# ----------------------------------------
FROM node:18-alpine AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración de dependencias (package.json y package-lock.json)
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Copia el código fuente del proyecto al contenedor
COPY . .

# Construye la aplicación de React. 
# Si usas Vite o Create React App, "npm run build" generará la carpeta de salida (ej. dist/ o build/).
RUN npm run build

# ----------------------------------------
# Etapa 2: Servir (Serve)
# Esta etapa usa un servidor web ligero para servir los archivos estáticos generados
# ----------------------------------------
FROM nginx:alpine AS serve

# Copia los archivos estáticos compilados desde la etapa 'build'
# Si tu comando 'npm run build' genera los archivos en una carpeta diferente a 'dist', 
# cambia '/app/dist' por la ruta correcta (ej. '/app/build')
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configuración de Nginx. Esto es útil si necesitas redireccionamientos (ej. para routing de React).
# Si no tienes un archivo nginx.conf personalizado, puedes omitir esta línea, pero es recomendable para SPAs.
# COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

# Comando para iniciar Nginx y servir la aplicación
CMD ["nginx", "-g", "daemon off;"]