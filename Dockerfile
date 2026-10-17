FROM alpine:3.20 AS builder

ENV HUGO_VERSION=0.167.0
ENV HUGO_ENVIRONMENT=production
ENV HUGO_CACHEDIR=/tmp/hugo_cache

RUN apk add --no-cache wget git ca-certificates libc6-compat libstdc++ libgcc
 

RUN wget -O /tmp/hugo.tar.gz \
    https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz \
    && tar -xzf /tmp/hugo.tar.gz -C /usr/local/bin hugo \
    && rm /tmp/hugo.tar.gz


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
