FROM httpd:2.4
EXPOSE 80
COPY ./src/ /usr/local/apache2/htdocs/

