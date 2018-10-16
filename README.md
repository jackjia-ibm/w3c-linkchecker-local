# w3c-linkchecker-local

Run w3c link checker on local directory. This is a wrapper command line of [w3c Link Checker](https://github.com/w3c/link-checker), so you need `checklink` command pre-installed.

## Run CheckLink In Docker Container

This image is created with ability to test local files.

- Build docker image: `docker build -t jackjiaibm/w3c-linkchecker .`
- Start container: `docker run -it --rm jackjiaibm/w3c-linkchecker`
- Check a remote website: `docker run -it --rm jackjiaibm/w3c-linkchecker https://your-website.com`
- Check a local directory: `docker run -it --rm -v "$PWD":/usr/share/nginx/html jackjiaibm/w3c-linkchecker http://localhost`
- Check a local directory with a base path: `docker run -it --rm -v "$PWD":/usr/share/nginx/html/base-path jackjiaibm/w3c-linkchecker http://localhost/base-path`
