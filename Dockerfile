FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ffmpeg fonts-dejavu-core fonts-liberation2 fonts-lindenhill \
  && rm -rf /var/lib/apt/lists/* \
  && ffmpeg -version >/dev/null \
  && test -f /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf \
  && test -f /usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf \
  && test -f /usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf \
  && test -f /usr/share/fonts/truetype/lindenhill/LindenHill.otf

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . ./

ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg

CMD ["npm", "run", "marketing:worker"]
