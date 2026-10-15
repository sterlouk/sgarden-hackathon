 The frontend of SGarden platform.

## Prerequisites

- node >=16

## Install

```sh
$ npm i
```

## Run tests

```sh
$ npm test
```

## Development

```sh
$ npm start
```

## Production (with security headers for DAST testing)

```sh
$ npm run start:prod
```

This builds the production bundle and serves it with security headers (CSP, HSTS, X-Frame-Options, etc.).
Use this mode for security scanning (ZAP, OWASP) and production deployment.
