FROM alpine:3.20 AS builder

ENV HUGO_VERSION=0.128.0
ENV HUGO_ENVIRONMENT=production
ENV HUGO_CACHEDIR=/tmp/hugo_cache

RUN apk add --no-cache wget git ca-certificates libc6-compat libstdc++ libgcc
 

RUN wget -O /tmp/hugo.tar.gz \
    https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz \
    && tar -xzf /tmp/hugo.tar.gz -C /usr/local/bin hugo \
    && rm /tmp/hugo.tar.gz


ENV DART_SASS_VERSION=1.77.8

RUN wget -O /tmp/dart-sass.tar.gz \
    https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz \
    && tar -xzf /tmp/dart-sass.tar.gz -C /usr/local \
    && ln -s /usr/local/dart-sass/sass /usr/local/bin/sass \
    && rm /tmp/dart-sass.tar.gz

WORKDIR /site
COPY . .

ARG BASE_URL=/
RUN hugo --minify --baseURL "${BASE_URL}"

# ---------- Runtime ----------
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /site/public /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
