FROM node:18 AS buildStage

ENV TERM=xterm \
    HOME=/srv/package

WORKDIR ${HOME}

USER root

COPY ./package.json ${HOME}/package.json
COPY ./package-lock.json ${HOME}/package-lock.json

RUN cd ${HOME} \
    && npm install

COPY ./lib ${HOME}/lib
COPY ./bin ${HOME}/bin

RUN npm prune --production

# Exposed Docker Image
FROM node:18-slim

MAINTAINER Erik Hage <ehage4@gmail.com>
LABEL "Description" = "recipies-service"

USER root

ENV HOME=/srv/package \
    NODE=node

RUN mkdir -p /srv/package \
  && mkdir -p /srv/utils

WORKDIR ${HOME}

RUN mkdir -p ${HOME}/logs \
  && chown -R ${NODE}:${NODE} ${HOME}/logs

COPY --from=buildStage ${HOME}/node_modules ${HOME}/node_modules
COPY ./package.json ${HOME}/
COPY ./package-lock.json ${HOME}/
COPY ./lib ${HOME}/lib
COPY ./bin ${HOME}/bin

RUN chown -R ${NODE}:${NODE} /srv

ENV SERVICE_3000_NAME=recipes-service

EXPOSE 3000

USER ${NODE}

CMD [ "npm", "start" ]
