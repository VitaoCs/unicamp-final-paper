#!/bin/bash

# Cleaning ros2_docker_examples repository
cd apps/ros2_docker_examples/
rm output.txt
rm position.txt
touch output.txt
touch position.txt

# Execute node_exporter
cd ../node_exporter/
nohup ./node_exporter &

# Execute Prometheus
cd ../prometheus/
nohup ./prometheus --config.file=./prometheus.yml &

# Execute Pushgateway
docker run -d --name pushgateway -p 9091:9091 prom/pushgateway

# Init node app with file tails and ngrok
cd ../../
node index.js &

echo -e "[Start Script] Start script done!"