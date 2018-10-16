FROM nginx:stable-alpine

MAINTAINER Jack T. Jia <jack-tiefeng.jia@ibm.com>

# default version to install
ENV CHECKLINK_VERSION 4_81
# package URL
ARG CHECKLINK_URL=https://github.com/w3c/link-checker/archive/checklink-${CHECKLINK_VERSION}.tar.gz

# install dependencies
RUN apk update && apk add \
    make gcc g++ \
    openssl openssl-dev \
    perl perl-dev perl-lwp-protocol-https \
    curl wget \
    && rm  -rf /tmp/* /var/cache/apk/*
# install cpanm
RUN curl -L http://xrl.us/cpanm > /bin/cpanm && chmod +x /bin/cpanm

# download / build / install w3c link checker
RUN set -x \
    && curl -sSL ${CHECKLINK_URL} -o /tmp/link-checker.tar.gz \
    && tar -xzf /tmp/link-checker.tar.gz -C /tmp \
    && cd /tmp/link-checker-checklink-${CHECKLINK_VERSION} \
    && cpanm --installdeps . \
    && cpanm LWP::Protocol::https \
    && perl Makefile.PL \
    && make \
    && make test \
    && make install \
    && rm -rf /tmp/link-checker-checklink-${CHECKLINK_VERSION}

RUN mkdir -p /test
WORKDIR /test

RUN echo $'#!/bin/sh\n\
\n\
# start nginx in background\n\
/usr/sbin/nginx -g \'daemon off;\' &\n\
\n\
/usr/local/bin/checklink "$@"\n\
' > /test/checklink.sh
RUN chmod +x /test/checklink.sh

ENTRYPOINT ["/test/checklink.sh"]
