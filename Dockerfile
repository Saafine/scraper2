# UNSAFE, testing only !
# Unsafe puppeteer sage, check https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md
FROM node

WORKDIR /app
COPY package*.json /app/
RUN npm install

# Puppeteer stuff
RUN npm install puppeteer
RUN apt-get update && apt-get install -yq libgconf-2-4
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser ./node_modules \
    && chown -R pptruser:pptruser /etc/letsencrypt\

COPY ./ /app/
RUN npm run build

# Run everything after as non-privileged user.
USER pptruser

CMD [ "npm", "run", "start:prod" ]
