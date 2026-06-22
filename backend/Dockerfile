# Recruitkr backend — runs Express + Socket.IO + Puppeteer.
# Use a long-running container (AWS App Runner / ECS / Beanstalk-Docker / EC2),
# NOT Lambda: Socket.IO needs persistent connections and Puppeteer needs Chromium.
FROM node:20-slim

# System Chromium + the libraries Puppeteer needs to render PDFs headlessly.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      libnss3 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdrm2 \
      libgbm1 \
      libgtk-3-0 \
      libasound2 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libxkbcommon0 \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium and skip its own download.
# resume.service.js already reads PUPPETEER_EXECUTABLE_PATH / PUPPETEER_NO_SANDBOX.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_NO_SANDBOX=true \
    NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Install production deps first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

# Lightweight container healthcheck against the API health route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]
