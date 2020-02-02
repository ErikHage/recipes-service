FROM node:10 AS buildStage

ENV TERM=xterm \
    HOME=/srv/package

WORKDIR ${HOME}

COPY ./package.json ${HOME}/package.json

USER root

RUN cd ${HOME} \
    && npm install --loglevel info \
    && chown -R ${NODE} ${HOME}/node_modules

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

USER ${NODE}

# Exposed Docker Image
FROM node:10-slim

MAINTAINER Erik Hage <ehage4@gmail.com>
LABEL "Description" = "recipies-service"

USER root

ENV HOME=/srv/package

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
