FROM node:10 AS buildStage

ENV TERM=xterm \
    HOME=/srv/package

WORKDIR ${HOME}

USER root

COPY ./package.json ${HOME}/package.json

RUN cd ${HOME} \
    && npm install --loglevel info

## Setup for running unit tests

COPY ./.eslintrc ${HOME}/.eslintrc
COPY ./.eslintignore ${HOME}/.eslintignore
COPY ./.nycrc ${HOME}/.nycrc
COPY ./spec ${HOME}/spec

RUN mkdir -p ${HOME}/spec/coverage \
  && mkdir -p ${HOME}/spec/reports \
  && mkdir -p ${HOME}/.nyc_output \
  && chown -R ${NODE} ${HOME}/spec \
  && chown -R ${NODE} ${HOME}/.nyc_output

COPY ./lib ${HOME}/lib
COPY ./bin ${HOME}/bin

RUN npm prune --production

# Exposed Docker Image
FROM node:10-slim

MAINTAINER Erik Hage <ehage4@gmail.com>
LABEL "Description" = "recipies-service"

USER root

ENV HOME=/srv/package \
    NODE=node

RUN groupadd -r ${NODE} -g 433 \
  && useradd -u 431 -r -g ${NODE} -d /srv/package -s /bin/bash -c "Docker image user" ${NODE} \
  && mkdir -p /srv/package \
  && mkdir -p /srv/utils \
  && chown -R ${NODE}:${NODE} /srv

WORKDIR ${HOME}

RUN mkdir -p ${HOME}/logs \
  && chown -R ${NODE}:${NODE} ${HOME}/logs

COPY --from=buildStage ${HOME}/node_modules ${HOME}/node_modules
COPY ./package.json ${HOME}/
COPY ./lib ${HOME}/lib
COPY ./bin ${HOME}/bin

ENV SERVICE_3000_NAME=rwbbc-web-server

EXPOSE 3000

USER ${NODE}

CMD [ "npm", "start" ]
