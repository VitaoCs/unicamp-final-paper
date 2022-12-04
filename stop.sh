#!/bin/bash

# Saerching for PID process
PROCESS=($(ps -ef | grep -i index.js | awk '{print $2}'))
PROCESS+=($(ps -ef | grep -i prometheus | awk '{print $2}'))
PROCESS+=($(ps -ef | grep -i node_exporter | awk '{print $2}'))

for processPID in "${PROCESS[@]}"
do
    echo -e "[Stop Script] Killing process: $processPID" 
    kill -9 $processPID
done

DOCKER=($(docker ps -aqf "name=pushgateway"))
for containerId in "${DOCKER[@]}"
do
    echo -e "[Stop Script] Stoping docker container id: $containerId"
    docker stop $containerId
done

docker rm pushgateway

echo -e "[Stop Script] Stop script done!"
