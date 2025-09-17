# Use the official nginx image as the base image
FROM nginx:alpine

# Copy the static files to the nginx html directory
COPY ./libs /usr/share/nginx/html/libs
COPY ./index.html /usr/share/nginx/html/index.html
COPY ./style.css /usr/share/nginx/html/style.css
COPY ./main.js /usr/share/nginx/html/main.js
COPY ./auth.js /usr/share/nginx/html/auth.js

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
