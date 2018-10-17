# w3c-linkchecker-local

Run w3c link checker on local directory. This is a wrapper command line of [w3c Link Checker](https://github.com/w3c/link-checker), so you need `checklink` command pre-installed.

## Run CheckLink In Docker Container

This image is created with ability to test local files.

- Build docker image: `docker build -t jackjiaibm/w3c-linkchecker .`
- Start container: `docker run -it --rm jackjiaibm/w3c-linkchecker`
- Check a remote website: `docker run -it --rm jackjiaibm/w3c-linkchecker https://your-website.com`
- Check a local directory: `docker run -it --rm -v "$PWD":/usr/share/nginx/html jackjiaibm/w3c-linkchecker http://localhost`
- Check a local directory with a base path: `docker run -it --rm -v "$PWD":/usr/share/nginx/html/base-path jackjiaibm/w3c-linkchecker http://localhost/base-path`
- Pass extra command line options to run checklink: `docker run -it --rm jackjiaibm/w3c-linkchecker https://your-website.com --summary --recursive`

## Install NPM Package

### Install From Github Source Code

```
git clone https://github.com/jackjia-ibm/w3c-linkchecker-local
cd w3c-linkchecker-local
npm install
npm link
```

### Install From npm Registry

This tool is published to [npmjs.com](https://www.npmjs.com/package/w3c-linkchecker-local) as `w3c-linkchecker-local`.

```
npm install -g w3c-linkchecker-local
```

## Use CLI Tool

After installed the NPM package, run `w3c-linkchecker-local --help` to check available options.

Check [checklink manual](https://metacpan.org/pod/distribution/W3C-LinkChecker/bin/checklink.pod) for detail explanation on the options.

Example usage to validate links in my local docs directory:

```
w3c-linkchecker-local ~/path/to/my/docs/ --recursive --summary --base-url /docs/ --exclude https://github.com
```

You can capture the stdout and stderr of the command. If there are errors shown in stderr, that means the test failed.
