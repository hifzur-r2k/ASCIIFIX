# Use Alpine Node with LibreOffice pre-installed
FROM node:18-alpine

# Install LibreOffice and dependencies
RUN apk add --no-cache \
    libreoffice \
    python3 \
    py3-pip \
    ttf-dejavu \
    fontconfig

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
