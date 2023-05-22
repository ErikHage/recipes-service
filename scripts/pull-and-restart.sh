#!/bin/bash

if [ $# != 1 ]
then
  echo 'USAGE: $0 new-version-tag'
  exit 1
fi

imageName=ehage/recipes-service
newVersionTag=$1
currentVersionTag=$(<current-version)
currentDatetime=`date '+%Y-%m-%d %H:%M:%S'`

echo 'New Version      = '$newVersionTag
echo 'Current Version  = '$currentVersionTag

echo Pulling image $imageName:$newVersionTag
if ! docker pull $imageName:$newVersionTag
then
  echo FAILED to pull image $imageName:$newVersionTag
  exit 1
fi

echo Updating current-version from $currentVersionTag to $newVersionTag
echo $newVersionTag > current-version
echo "$currentDatetime -> $newVersionTag" >> version-history

# export env variable to be read in docker-compose
export VERSION_TAG=$currentVersionTag
docker-compose down

export VERSION_TAG=$newVersionTag
docker-compose up -d
