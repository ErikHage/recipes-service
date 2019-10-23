FROM theferalrooster/nodejs-buildtools:8.9.0 AS buildStage

ENV TERM=xterm \
    HOME=/srv/package

WORKDIR ${HOME}

COPY ./package.json ${HOME}/package.json

USER root

RUN cd ${HOME} \
    && npm install --loglevel info \
    && chown -R ${SWUSER} ${HOME}/node_modules

## Setup for running unit tests

COPY ./.eslintrc ${HOME}/.eslintrc
COPY ./.eslintignore ${HOME}/.eslintignore
COPY ./.nycrc ${HOME}/.nycrc
COPY ./spec ${HOME}/spec

RUN mkdir -p ${HOME}/spec/coverage \
  && mkdir -p ${HOME}/spec/reports \
  && mkdir -p ${HOME}/.nyc_output \
  && chown -R ${SWUSER} ${HOME}/spec \
  && chown -R ${SWUSER} ${HOME}/.nyc_output

COPY ./lib ${HOME}/lib
COPY ./bin ${HOME}/bin

RUN npm run lint \
  && npm run coverage \
  && npm run coverage-check \
  && npm prune --production

USER ${SWUSER}

# Exposed Docker Image
FROM theferalrooster/nodejs-base:8.9.0

MAINTAINER Erik Hage <ehage4@gmail.com>
LABEL "Description" = "recipies-service"

USER root

ENV HOME=/srv/package

WORKDIR ${HOME}

RUN mkdir -p ${HOME}/logs \
  && chown -R ${SWUSER}:${SWUSER} ${HOME}/logs

COPY --from=buildStage ${HOME}/node_modules ${HOME}/node_modules
COPY ./package.json ${HOME}/
COPY ./database.json ${HOME}/
COPY ./lib ${HOME}/lib
COPY ./bin ${HOME}/bin
COPY ./migrations ${HOME}/migrations

ENV SERVICE_3000_NAME=rwbbc-web-server

EXPOSE 3000

USER ${SWUSER}

CMD [ "npm", "start" ]
