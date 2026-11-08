FROM nginx:alpine

COPY index.html privacy.html support.html 404.html /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80
